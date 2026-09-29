import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Notice, spacing } from '@/shared/ui';

export function PixKeyRequired() {
  return (
    <View style={styles.box}>
      <Notice message="Cadastre sua chave Pix no perfil para aceitar freelas. É por ela que você recebe." />
      <Button
        variant="secondary"
        title="Cadastrar chave Pix"
        onPress={() => router.push('/professional/edit-profile')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: spacing.md },
});
