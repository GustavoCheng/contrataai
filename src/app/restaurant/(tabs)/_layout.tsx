import { Tabs } from 'expo-router/js-tabs';
import { tabBarScreenOptions, tabIcon } from '@/shared/ui';

export default function RestaurantTabs() {
  return (
    <Tabs screenOptions={tabBarScreenOptions}>
      <Tabs.Screen
        name="professionals"
        options={{ title: 'Explorar', tabBarIcon: tabIcon('people-outline') }}
      />
      <Tabs.Screen
        name="jobs"
        options={{ title: 'Vagas', tabBarIcon: tabIcon('briefcase-outline') }}
      />
      <Tabs.Screen
        name="gigs"
        options={{ title: 'Freelas', tabBarIcon: tabIcon('flash-outline') }}
      />
      <Tabs.Screen
        name="inbox"
        options={{ title: 'Mensagens', tabBarIcon: tabIcon('chatbubbles-outline') }}
      />
      <Tabs.Screen
        name="store"
        options={{ title: 'Loja', tabBarIcon: tabIcon('storefront-outline') }}
      />
    </Tabs>
  );
}
