import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { formatCep } from '@/shared/lib/location';
import {
  professionalFormSchema,
  type ProfessionalFormInput,
  type ProfessionalFormValues,
} from '../schemas';
import type { ProfessionalSettings } from '../services/professionals.service';

/** Formulário do perfil profissional, vazio no onboarding ou preenchido na edição. */
export function useProfessionalForm(settings: ProfessionalSettings | null) {
  return useForm<ProfessionalFormInput, unknown, ProfessionalFormValues>({
    resolver: zodResolver(professionalFormSchema),
    defaultValues: settings ? toFormValues(settings) : emptyValues,
  });
}

const emptyValues: Partial<ProfessionalFormInput> = {
  photoPath: null,
  fullName: '',
  secondaryRoles: [],
  experience: '',
  postalCode: '',
  address: null,
  availableForGigs: true,
  pixKeyType: null,
  pixKey: '',
};

function toFormValues(settings: ProfessionalSettings): ProfessionalFormInput {
  const location = settings.professional_locations;
  const payout = settings.payout_accounts;
  return {
    photoPath: settings.photo_path,
    fullName: settings.full_name,
    mainRole: settings.main_role,
    secondaryRoles: settings.secondary_roles,
    experience: settings.experience ?? '',
    postalCode: location ? formatCep(location.postal_code) : '',
    address: location && {
      postalCode: location.postal_code,
      street: null,
      neighborhood: settings.neighborhood,
      city: settings.city,
      state: settings.state,
      latitude: location.latitude,
      longitude: location.longitude,
    },
    availableForGigs: settings.available_for_gigs,
    pixKeyType: payout?.pix_key_type ?? null,
    pixKey: payout?.pix_key ?? '',
  };
}
