import { router } from 'expo-router';
import { useUserId } from '@/shared/hooks/useSession';
import { Button, ErrorView, LoadingView, Notice, Screen } from '@/shared/ui';
import { ProfessionalFormFields } from '../components/ProfessionalFormFields';
import { useProfessionalSettings, useSaveProfessional } from '../hooks/useProfessional';
import { useProfessionalForm } from '../hooks/useProfessionalForm';
import type { ProfessionalSettings } from '../services/professionals.service';

export function EditProfileScreen() {
  const userId = useUserId();
  const settings = useProfessionalSettings(userId);

  if (settings.isPending) return <LoadingView />;
  if (settings.isError || !settings.data) {
    return (
      <ErrorView
        message={settings.error?.message ?? 'Perfil não encontrado.'}
        onRetry={() => settings.refetch()}
      />
    );
  }
  return <EditProfileForm userId={userId} settings={settings.data} />;
}

/** Separado para o formulário nascer com os dados já carregados. */
function EditProfileForm({ userId, settings }: { userId: string; settings: ProfessionalSettings }) {
  const form = useProfessionalForm(settings);
  const save = useSaveProfessional(userId);

  const submit = form.handleSubmit((values) =>
    save.mutate(
      { userId, values, previousPhotoPath: settings.photo_path },
      { onSuccess: () => router.back() },
    ),
  );

  return (
    <Screen
      edges={['bottom']}
      footer={<Button title="Salvar alterações" loading={save.isPending} onPress={submit} />}
    >
      {save.error && <Notice message={save.error.message} />}
      <ProfessionalFormFields form={form} />
    </Screen>
  );
}
