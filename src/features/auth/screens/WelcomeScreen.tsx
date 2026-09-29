import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Screen, Text, colors, radius, spacing } from '@/shared/ui';
import { AccountChoiceCard } from '../components/AccountChoiceCard';

export function WelcomeScreen() {
  return (
    <Screen
      footer={
        <>
          <AccountChoiceCard
            icon="storefront-outline"
            title="Sou restaurante"
            description="Contrate para vagas fixas e freelas"
            onPress={() => router.push('/sign-up-restaurant')}
          />
          <AccountChoiceCard
            icon="person-outline"
            title="Sou profissional"
            description="Encontre vagas fixas e freelas perto de você"
            onPress={() => router.push('/sign-up-professional')}
          />
          <Button
            variant="ghost"
            title="Já tenho conta · Entrar"
            onPress={() => router.push('/sign-in')}
          />
        </>
      }
    >
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="restaurant" size={28} color={colors.onPrimary} />
        </View>
        <Text variant="title">ContrataAí</Text>
        <Text>Restaurantes e profissionais de cozinha e operação, no mesmo lugar.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, justifyContent: 'center', gap: spacing.md },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
});
