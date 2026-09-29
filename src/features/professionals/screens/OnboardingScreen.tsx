import { useUserId } from '@/shared/hooks/useSession';
import { Button, Notice, Screen, ScreenTitle } from '@/shared/ui';
import { ProfessionalFormFields } from '../components/ProfessionalFormFields';
import { useSaveProfessional } from '../hooks/useProfessional';
import { useProfessionalForm } from '../hooks/useProfessionalForm';

/** Primeira entrada: ao salvar, o layout da área troca para as abas sozinho. */
export function OnboardingScreen() {
  const userId = useUserId();
  const form = useProfessionalForm(null);
  const save = useSaveProfessional(userId);

  const submit = form.handleSubmit((values) =>
    save.mutate({ userId, values, previousPhotoPath: null }),
  );

  return (
    <Screen footer={<Button title="Salvar perfil" loading={save.isPending} onPress={submit} />}>
      <ScreenTitle
        title="Monte seu perfil"
        subtitle="É assim que os restaurantes vão te encontrar."
      />
      {save.error && <Notice message={save.error.message} />}
      <ProfessionalFormFields form={form} />
    </Screen>
  );
}
