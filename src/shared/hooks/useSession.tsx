import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type SessionState = { session: Session | null; isLoading: boolean };

const SessionContext = createContext<SessionState>({ session: null, isLoading: true });

/** Sessão do Supabase Auth: único estado global de cliente, junto com o tipo de conta. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ session: null, isLoading: true });

  useEffect(() => {
    // INITIAL_SESSION chega logo na inscrição, com a sessão salva no aparelho.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, isLoading: false });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <SessionContext value={state}>{children}</SessionContext>;
}

export const useSession = () => use(SessionContext);

/** Id do usuário logado. Só para telas dentro das áreas protegidas (sessão garantida pelo layout). */
export function useUserId(): string {
  const { session } = useSession();
  if (!session) throw new Error('useUserId usado fora de uma área logada');
  return session.user.id;
}
