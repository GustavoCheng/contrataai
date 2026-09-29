import { z } from 'zod';
import { type Company, fetchCompany } from '../_shared/brasil-api.ts';
import { type Admin, handle, HttpError, readBody } from '../_shared/http.ts';

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  cnpj: z
    .string()
    .transform((value) => value.replace(/[^0-9a-z]/gi, '').toUpperCase())
    .pipe(z.string().regex(/^[0-9A-Z]{12}[0-9]{2}$/)),
});

/**
 * Cadastro de restaurante: só cria a conta se o CNPJ existir e estiver ATIVO na Receita.
 * A conta nasce com e-mail não confirmado; o código de confirmação vai por e-mail.
 */
export default handle('publishable', async (req, ctx) => {
  const { email, password, cnpj } = await readBody(req, bodySchema);

  const company = await fetchCompany(cnpj);
  if (company.status !== 'ATIVA') {
    throw new HttpError(422, 'cnpj_inactive', { situation: company.status });
  }

  const admin = ctx.supabaseAdmin;
  const { count } = await admin
    .from('restaurants')
    .select('id', { count: 'exact', head: true })
    .eq('cnpj', cnpj);
  if (count) throw new HttpError(409, 'cnpj_taken');

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
  });
  if (createError) {
    if (createError.code === 'email_exists') throw new HttpError(409, 'email_taken');
    if (createError.code === 'weak_password') throw new HttpError(422, 'weak_password');
    throw createError;
  }

  const userId = created.user.id;
  const { error: restaurantError } = await createRestaurant(admin, userId, cnpj, company);
  if (restaurantError) {
    await admin.auth.admin.deleteUser(userId);
    if (restaurantError.code === '23505') throw new HttpError(409, 'cnpj_taken');
    throw restaurantError;
  }

  // A Admin API não envia e-mail; pedimos o código de confirmação como um cadastro comum.
  const { error: resendError } = await ctx.supabase.auth.resend({ type: 'signup', email });
  if (resendError) console.error('Falha ao enviar código de confirmação', resendError);

  return Response.json({ email }, { status: 201 });
});

/** Todo cadastro nasce profissional (trigger); aqui a conta vira restaurante e ganha a loja. */
async function createRestaurant(admin: Admin, userId: string, cnpj: string, company: Company) {
  const { error } = await admin
    .from('profiles')
    .update({ account_type: 'restaurant' })
    .eq('id', userId);
  if (error) return { error };

  return await admin.from('restaurants').insert({
    id: userId,
    cnpj,
    legal_name: company.legalName,
    name: company.name,
    founded_on: company.openedOn,
    street: company.street,
    number: company.number,
    complement: company.complement,
    neighborhood: company.neighborhood,
    postal_code: company.postalCode,
    city: company.city,
    state: company.state,
    latitude: company.latitude,
    longitude: company.longitude,
  });
}
