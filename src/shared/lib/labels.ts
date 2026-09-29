import { Constants, type Enums } from './database.types';

export type JobRole = Enums<'job_role'>;
export type WorkShift = Enums<'work_shift'>;
export type ApplicationStatus = Enums<'application_status'>;
export type GigStatus = Enums<'gig_status'>;
export type AccountType = Enums<'account_type'>;

/** Ordem de exibição dos cargos (a do enum no banco). */
export const jobRoles = Constants.public.Enums.job_role;

export const roleLabels: Record<JobRole, string> = {
  cook: 'Cozinheiro(a)',
  kitchen_assistant: 'Auxiliar de cozinha',
  sushi_chef: 'Sushiman',
  griddle_cook: 'Chapeiro(a)',
  pizza_maker: 'Pizzaiolo(a)',
  confectioner: 'Confeiteiro(a)',
  dishwasher: 'Auxiliar de limpeza',
  waiter: 'Garçom/Garçonete',
  bartender: 'Bartender',
  cashier: 'Caixa',
  delivery_rider: 'Motoboy',
};

export const roleOptions = jobRoles.map((value) => ({ value, label: roleLabels[value] }));

export const shiftLabels: Record<WorkShift, string> = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  night: 'Noite',
  overnight: 'Madrugada',
  full_day: 'Integral',
};

export const workShifts = Constants.public.Enums.work_shift;

export const shiftOptions = workShifts.map((value) => ({ value, label: shiftLabels[value] }));

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  sent: 'Enviada',
  accepted: 'Aceita',
  rejected: 'Recusada',
};

export const applicationStatusTones = {
  sent: 'attention',
  accepted: 'positive',
  rejected: 'negative',
} as const satisfies Record<ApplicationStatus, string>;

export const gigStatusLabels: Record<GigStatus, string> = {
  open: 'Aberto',
  confirmed: 'Aguardando pagamento',
  paid_held: 'Pago · valor retido',
  checked_in: 'Em andamento',
  checked_out: 'Turno encerrado',
  released: 'Pagamento liberado',
  cancelled: 'Cancelado',
  disputed: 'Em disputa',
};

export const gigStatusTones = {
  open: 'attention',
  confirmed: 'attention',
  paid_held: 'positive',
  checked_in: 'positive',
  checked_out: 'positive',
  released: 'positive',
  cancelled: 'neutral',
  disputed: 'negative',
} as const satisfies Record<GigStatus, string>;
