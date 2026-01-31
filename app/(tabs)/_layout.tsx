import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

// Custom tab bar icon component
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View className="items-center justify-center pt-2">
      <Text
        className={`text-xs tracking-wider ${focused ? 'text-setly-text' : 'text-setly-muted'}`}
        style={{ fontFamily: 'SpaceMono_400Regular' }}
      >
        {name}
      </Text>
      {focused && (
        <View className="w-1 h-1 rounded-full bg-setly-text mt-1" />
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: '#2A2A2A',
          borderTopWidth: 0.5,
          height: 70,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="HOME" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="CALENDAR" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon name="SETTINGS" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
