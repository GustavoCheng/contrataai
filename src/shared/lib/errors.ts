import { FunctionsFetchError, FunctionsHttpError, isAuthError } from '@supabase/supabase-js';

const messages = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail para entrar. Enviamos um novo código.',
  email_taken: 'Este e-mail já tem cadastro. Entre com sua senha.',
  weak_password: 'Senha fraca. Use pelo menos 8 caracteres.',
  invalid_code: 'Código inválido ou vencido. Confira ou peça um novo.',
  rate_limited: 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.',
  cnpj_invalid: 'CNPJ inválido. Confira os números.',
  cnpj_not_found: 'Não encontramos esse CNPJ na Receita Federal.',
  cnpj_inactive:
    'Esse CNPJ está com situação {situation} na Receita Federal. Só CNPJ ativo pode se cadastrar.',
  cnpj_taken: 'Esse CNPJ já tem cadastro no ContrataAí.',
  cnpj_lookup_failed: 'Não conseguimos consultar a Receita agora. Tente de novo em instantes.',
  cep_invalid: 'CEP inválido. Confira os 8 números.',
  cep_not_found: 'Não encontramos esse CEP.',
  cep_lookup_failed: 'Não conseguimos consultar o CEP agora. Tente de novo em instantes.',
  image_too_large: 'Foto muito grande. Escolha uma de até 5 MB.',
  image_invalid: 'Formato de foto não aceito. Use JPG, PNG ou WebP.',
  camera_denied: 'Permita o acesso à câmera nas configurações do celular.',
  already_applied: 'Você já se candidatou a esta vaga.',
  already_accepted: 'Você já aceitou este freela.',
  gig_unavailable: 'Esse freela não está mais disponível.',
  gig_not_confirmable: 'Esse profissional não pode mais ser confirmado. Atualize a tela.',
  gig_not_found: 'Não encontramos esse freela.',
  gig_not_payable: 'Esse freela não está aguardando pagamento. Atualize a tela.',
  already_paid: 'Esse freela já está pago.',
  payment_provider_error: 'O serviço de pagamento não respondeu. Tente de novo em instantes.',
  checkpoint_unavailable: 'Não há check-in nem check-out pendente neste freela.',
  checkpoint_invalid: 'Código incorreto. Confira os 4 números com o restaurante.',
  checkpoint_expired:
    'Esse código não vale mais. Peça ao restaurante para mostrar o código no app dele.',
  checkpoint_locked: 'Muitas tentativas erradas. Peça ao restaurante para gerar um novo código.',
  checkpoint_not_yours: 'Só o profissional confirmado neste freela pode digitar o código.',
  gig_not_releasable: 'O pagamento só pode ser liberado depois do check-out.',
  payout_account_missing:
    'O freelancer está sem chave Pix cadastrada. Peça para ele cadastrar e tente de novo.',
  gig_not_cancellable:
    'Esse freela não pode mais ser cancelado. Se algo deu errado no turno, abra uma disputa.',
  gig_not_disputable: 'A disputa só pode ser aberta entre o pagamento e a liberação.',
  already_reviewed: 'Você já avaliou este freela.',
  forbidden: 'Você não tem permissão para fazer isso.',
  unauthorized: 'Sua sessão expirou. Entre de novo.',
  invalid_input: 'Não entendemos o pedido. Atualize o app e tente de novo.',
  network: 'Sem conexão com o servidor. Verifique sua internet e tente de novo.',
  unknown: 'Algo deu errado. Tente de novo.',
} as const;

export type AppErrorCode = keyof typeof messages;

/** Erro tipado que os serviços lançam; `message` já está pronta para a tela. */
export class AppError extends Error {
  constructor(
    readonly code: AppErrorCode,
    details: Record<string, string> = {},
  ) {
    super(messages[code].replace(/\{(\w+)\}/g, (_, key: string) => details[key] ?? ''));
    this.name = 'AppError';
  }
}

const isAppErrorCode = (code: unknown): code is AppErrorCode =>
  typeof code === 'string' && code in messages;

const authCodes: Partial<Record<string, AppErrorCode>> = {
  invalid_credentials: 'invalid_credentials',
  email_not_confirmed: 'email_not_confirmed',
  user_already_exists: 'email_taken',
  email_exists: 'email_taken',
  weak_password: 'weak_password',
  otp_expired: 'invalid_code',
  over_email_send_rate_limit: 'rate_limited',
  over_request_rate_limit: 'rate_limited',
};

/** Converte erros do Supabase (Auth, Edge Functions, PostgREST) em AppError. */
export async function toAppError(error: unknown): Promise<AppError> {
  if (error instanceof AppError) return error;

  if (error instanceof FunctionsHttpError) {
    // As Edge Functions respondem { code, ...detalhes } (ver supabase/functions/_shared/http.ts).
    const body: unknown = await error.context.json().catch(() => null);
    const { code, ...details } = (typeof body === 'object' && body ? body : {}) as Record<
      string,
      string
    >;
    return new AppError(isAppErrorCode(code) ? code : 'unknown', details);
  }

  if (error instanceof FunctionsFetchError) return new AppError('network');

  // Regras do banco (raise exception 'gig_not_confirmable') chegam como P0001 com o código na mensagem.
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    error.code === 'P0001' &&
    isAppErrorCode(error.message)
  ) {
    return new AppError(error.message);
  }

  if (isAuthError(error)) {
    if (error.name === 'AuthRetryableFetchError') return new AppError('network');
    return new AppError(authCodes[error.code ?? ''] ?? 'unknown');
  }

  if (error instanceof Error && error.name === 'StorageApiError') {
    if (/size/i.test(error.message)) return new AppError('image_too_large');
    if (/mime/i.test(error.message)) return new AppError('image_invalid');
  }

  // Sem rede: TypeError no app ou { message: "TypeError: Network request failed" } do PostgREST.
  const message =
    typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : '';
  return new AppError(/fetch|network/i.test(message) ? 'network' : 'unknown');
}
