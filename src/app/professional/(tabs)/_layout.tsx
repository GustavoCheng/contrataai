import { Tabs } from 'expo-router/js-tabs';
import { tabBarScreenOptions, tabIcon } from '@/shared/ui';

export default function ProfessionalTabs() {
  return (
    <Tabs screenOptions={tabBarScreenOptions}>
      <Tabs.Screen name="explore" options={{ title: 'Explorar', tabBarIcon: tabIcon('search') }} />
      <Tabs.Screen
        name="gigs"
        options={{ title: 'Freelas', tabBarIcon: tabIcon('flash-outline') }}
      />
      <Tabs.Screen
        name="applications"
        options={{ title: 'Inscrições', tabBarIcon: tabIcon('paper-plane-outline') }}
      />
      <Tabs.Screen
        name="inbox"
        options={{ title: 'Mensagens', tabBarIcon: tabIcon('chatbubbles-outline') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarIcon: tabIcon('person-circle-outline') }}
      />
    </Tabs>
  );
}
