import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import type { Database } from './database.types';

const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!configuredUrl || !publishableKey) {
  throw new Error(
    'Defina EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY no .env (veja .env.example).',
  );
}

/**
 * Supabase local visto do celular: "127.0.0.1" seria o próprio aparelho. Em desenvolvimento,
 * troca pelo endereço do computador que está servindo o app (Expo), seja qual for a rede.
 * URL de produção ou com endereço explícito fica como está.
 */
function resolveUrl(url: string): string {
  const devHost = Constants.expoConfig?.hostUri?.replace(/:\d+$/, '');
  if (!__DEV__ || Platform.OS === 'web' || !devHost) return url;
  return url.replace(/\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/, `//${devHost}`);
}

export const supabase = createClient<Database>(resolveUrl(configuredUrl), publishableKey, {
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Renova o token só com o app em primeiro plano (recomendação do Supabase para React Native).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
