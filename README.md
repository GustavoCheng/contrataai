# ContrataAí

Marketplace mobile (iOS e Android) que conecta restaurantes a profissionais de cozinha e operação.
Expo SDK 57 + Expo Router + TypeScript, com Supabase (Auth, Postgres, Storage, Realtime e Edge Functions).

Plano do MVP, decisões e sprints: [docs/mvp1/plano.md](docs/mvp1/plano.md).

## Rodar o app

Pré-requisitos: Node 20+ e o app **Expo Go** no celular.

```bash
npm install
npx expo start          # leia o QR Code com o Expo Go
```

- Crie o `.env` a partir do `.env.example`. Ele aponta para o **servidor na nuvem**, então não é preciso Docker nem banco no computador.
- Contas de demonstração (senha `contrataai123`): `restaurante@contrataai.dev` e `profissional@contrataai.dev` (sem perfil, para testar o onboarding). Profissionais com chave Pix: `marina@`, `rafael@`, `diego@` e `lucas@contrataai.dev`.
- O celular baixa o app do computador que está rodando o `npx expo start`, então os dois precisam estar na mesma rede (Wi-Fi ou o hotspot do celular). Os dados vêm da nuvem.
- Depois de mudar o `.env`, reinicie com `npx expo start -c` (o `-c` limpa o cache).

### Se o app não abrir no celular

| O que aparece no celular                                         | Causa provável                                     | O que fazer                                                                                                                              |
| ---------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| "Project is incompatible with this version of Expo Go"           | Expo Go desatualizado (o projeto usa o SDK 57)     | Atualize o Expo Go na loja de apps.                                                                                                      |
| O QR não carrega, fica em "Opening project" ou dá tempo esgotado | Redes diferentes, ou firewall/antivírus bloqueando | Coloque celular e computador no mesmo Wi-Fi. No firewall (Windows ou antivírus), marque a rede como doméstica/confiável e libere o Node. |
| O app abre, mas mostra "Sem conexão com o servidor"              | Celular sem internet, ou projeto na nuvem pausado  | Confira a internet do celular. No plano gratuito, o Supabase pausa o projeto após 7 dias sem uso: reative no painel.                     |
| Funciona em casa, mas não em Wi-Fi público ou de empresa         | A rede isola os aparelhos entre si                 | Ligue o roteador Wi-Fi (hotspot) do celular e conecte o computador nele.                                                                 |

## Servidor na nuvem

Projeto Supabase `contrataai` (`pxpghoicyyraezfokxlc`, região de São Paulo, plano gratuito), com o mesmo banco, as mesmas regras de acesso e as mesmas Edge Functions do ambiente local. O Asaas continua no **sandbox**: nenhum pagamento é de verdade.

Configuração feita uma vez (e de novo sempre que um segredo mudar):

```bash
npx supabase login      # abre o navegador para autorizar
npm run cloud:setup     # envia os segredos e cadastra o webhook no Asaas
```

O `cloud:setup` envia o conteúdo de `supabase/functions/.env` para os segredos das Edge Functions e cadastra no Asaas o webhook que avisa o servidor dos pagamentos.

Limites conhecidos deste ambiente:

- **CEP sem coordenadas:** o serviço de CEP (AwesomeAPI) limita o uso gratuito por endereço de origem, e na nuvem esse endereço é compartilhado. Sem `AWESOMEAPI_KEY`, o endereço vem de um serviço reserva (BrasilAPI), sem coordenadas, e os perfis salvos assim não mostram distância nos cards. A chave é gratuita: crie em https://awesomeapi.com.br, coloque em `supabase/functions/.env` e rode `npm run cloud:setup`.
- **Cadastro de contas novas:** o e-mail padrão do Supabase só envia para os membros da organização e manda um link no lugar do código de 6 dígitos. Para cadastrar outras pessoas, configure um SMTP próprio e o modelo de e-mail (veja "Antes de lançar"). As contas de demonstração não dependem disso.
- **Contas de demonstração:** têm senha conhecida. Apague-as antes de usar dinheiro de verdade.

Para publicar mudanças no servidor:

- **Pelo GitHub (automático):** com a integração do Supabase com o GitHub ligada (Project Settings → Integrations, opção "Deploy to production"), todo envio para a `main` aplica as migrações novas e publica as funções declaradas em `supabase/config.toml`. Não envia segredos, não muda as configurações de login e não carrega o seed.
- **Pelo computador:** `npx supabase db push` para as migrações e `npx supabase functions deploy` para as funções (pedem o `npx supabase login` e o projeto vinculado com `npx supabase link --project-ref pxpghoicyyraezfokxlc`).

## App instalável (sem depender do computador)

O Expo Go baixa o app do computador, então só funciona com os dois na mesma rede. Para usar em qualquer lugar, ou passar para outras pessoas testarem, gere o app instalável. A montagem acontece nos servidores do Expo, não no seu computador.

```bash
npx eas-cli@latest login                                        # conta gratuita em expo.dev
npx eas-cli@latest build --platform android --profile preview   # gera um APK para Android
```

No fim (10 a 20 minutos), o comando mostra um link e um QR Code para instalar no celular Android. Quem receber o link instala sem precisar de conta. No iPhone, o app instalável exige a conta de desenvolvedor da Apple (paga); até lá, o iPhone testa pelo Expo Go.

O perfil `preview` do `eas.json` já aponta para o servidor na nuvem.

## Pagamentos no sandbox do Asaas

O app cria cobranças, estornos e transferências de verdade no sandbox. O que acontece fora do app é feito por dois comandos, que valem para o servidor que o app está usando:

| Comando                  | Quando usar                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm run sandbox:pay`    | Depois de tocar em "Pagar com Pix": confirma no sandbox o Pix pendente mais recente. O freela vai para "Pago", ao vivo.      |
| `npm run sandbox:payout` | Depois de "Liberar": avisa o servidor que a transferência mais recente foi concluída. O repasse vira "Pix enviado", ao vivo. |

- **Saldo do sandbox:** liberar o pagamento faz uma transferência real no sandbox, que precisa de saldo disponível. Às vezes o sandbox credita o Pix confirmado só dois dias depois. Sem saldo, o app mostra "O serviço de pagamento não respondeu" e o freela continua em "Turno encerrado". Nesse caso, teste a liberação com um freela de valor baixo ou aguarde o crédito.
- **Código de check-in/out:** o restaurante toca em "Mostrar código" e o freelancer digita os 4 números no app dele, cada um logado na sua conta. O código vale 10 minutos, serve uma vez e trava depois de 5 erros (o restaurante gera outro).

## Desenvolver com o Supabase local

Para mexer no banco ou nas funções sem afetar a nuvem. Pré-requisito: Docker Desktop aberto.

```bash
npm run db:start        # sobe o Supabase local (na 1ª vez baixa as imagens do Docker)
```

- Crie um `.env.local` com o endereço e a chave locais (o modelo está no `.env.example`). Ele tem prioridade sobre o `.env`; apague-o para voltar à nuvem.
- Não precisa colocar o IP do computador: no celular, o app troca `127.0.0.1` pelo endereço de quem está rodando o `npx expo start`, em qualquer rede.
- Crie o `supabase/functions/.env` a partir do `supabase/functions/.env.example`.
- Os e-mails do ambiente local, com o código de confirmação de 6 dígitos, chegam no **Mailpit**: http://127.0.0.1:54324
- Depois de criar uma Edge Function nova, reinicie o Supabase local (`npx supabase stop` e `npm run db:start`); as existentes recarregam sozinhas.
- Se o celular não conectar ao servidor local, libere o Docker Desktop no firewall.

## Scripts

| Comando                                          | O que faz                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `npm run lint` / `npm run typecheck`             | ESLint + Prettier e TypeScript strict do app                        |
| `npm run functions:check`                        | Checagem de tipos das Edge Functions (Deno)                         |
| `npm run db:test`                                | Testes pgTAP de RLS e da máquina de estados do freela               |
| `npm run db:reset`                               | Recria o banco local com as migrações e o seed                      |
| `npm run gen:types`                              | Regera os tipos do banco (app e Edge Functions) após mudar o schema |
| `npm run sandbox:pay` / `npm run sandbox:payout` | Pagam o Pix e concluem o repasse no sandbox do Asaas (ver acima)    |
| `npm run cloud:setup`                            | Envia os segredos para a nuvem e cadastra o webhook no Asaas        |

## Antes de lançar (produção)

1. **Asaas de produção:** troque `ASAAS_API_URL` para `https://api.asaas.com/v3` e `ASAAS_API_KEY` pela chave de produção em `supabase/functions/.env` e rode `npm run cloud:setup` (o webhook é cadastrado na conta da chave informada).
2. **Aprovação das transferências:** em produção, o Asaas exige autorizar cada transferência feita pela API (no app do Asaas) ou liberar IPs fixos, e as Edge Functions não têm IP fixo. No MVP, o repasse fica "em andamento" até a aprovação manual; o webhook `TRANSFER_DONE` atualiza a tela sozinho.
3. **Saldo de reserva na conta Asaas:** o Asaas desconta a tarifa do Pix recebido (hoje R$ 1,99) e o repasse ao freelancer é do valor cheio, porque a taxa da plataforma ainda é 0. Mantenha um pequeno saldo na conta para cobrir essa diferença; sem ele, a liberação falha.
4. **E-mail de cadastro:** configure um SMTP próprio (Authentication → SMTP no painel do Supabase) e, no modelo "Confirm signup", use o conteúdo de `supabase/templates/confirmation.html`, que envia o código de 6 dígitos.
5. **Chave do serviço de CEP** (`AWESOMEAPI_KEY`), para os perfis novos terem distância nos cards.
6. **Contas de demonstração:** apague os usuários `@contrataai.dev` no painel do Supabase (Authentication → Users).
7. **Identificador do app:** `com.contrataai.app` (Android e iOS) em `app.json`. Troque antes da primeira publicação nas lojas se quiser outro; depois de publicado, não muda mais.

## Estrutura

- `src/app/` — rotas (Expo Router). Cada arquivo só reexporta uma tela.
- `src/features/<feature>/` — telas, componentes, hooks e serviços de cada feature.
- `src/shared/` — UI, tema, cliente Supabase e utilitários usados por 2+ features.
- `supabase/migrations/` — schema, RLS e regras de negócio do banco.
- `supabase/functions/` — Edge Functions (integrações externas e regras sensíveis).
- `supabase/tests/` — testes do banco.
- `scripts/` — checagem das Edge Functions, sandbox do Asaas e configuração da nuvem.
- `eas.json` — perfis de montagem do app instalável.
