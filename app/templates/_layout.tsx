import { Stack } from 'expo-router';

export default function TemplatesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: '#0A0A0A' },
      }}
    />
  );
}
