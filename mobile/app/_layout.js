import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { storage } from '../lib/storage';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    storage.getItem('token').then((t) => {
      const auth = !!t;
      setIsAuth(auth);
      if (auth) router.replace('/(tabs)');
    });
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="send" options={{ headerShown: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
