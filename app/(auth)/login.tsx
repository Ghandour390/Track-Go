import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, Text, TextInput, View } from 'react-native';

import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const { signIn, state } = useAuth();
  const [email, setEmail] = useState('driver@trackgo.app');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState<string | null>(null);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeIn, slideUp]);

  async function handleLogin(): Promise<void> {
    try {
      setError(null);
      await signIn(email.trim().toLowerCase(), password.trim());
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Connexion impossible.');
    }
  }

  return (
    <View className="relative flex-1 items-center justify-center overflow-hidden bg-[#1f2937] px-6">
      <View className="absolute -top-20 -left-16 h-56 w-56 rounded-full bg-sky-300/45" />
      <View className="absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-[#7a2e3b]/45" />
      <View className="absolute top-24 right-10 h-24 w-24 rounded-full bg-[#f5e9d5]/45" />

      <Animated.View
        className="w-full max-w-md rounded-3xl border border-white/20 bg-[#f4e8d4] p-6 shadow-2xl"
        style={{
          opacity: fadeIn,
          transform: [{ translateY: slideUp }],
        }}>
        <View className="mb-6">
          <Text className="text-3xl font-extrabold text-[#1e3a5f]">Track&Go</Text>
          <Text className="mt-2 text-sm font-medium text-[#4b5563]">
            Connecte-toi à ton espace conducteur
          </Text>
        </View>

        <View className="gap-4">
          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-[1.5px] text-[#1e3a5f]">
              Email pro
            </Text>
            <TextInput
              className="h-12 rounded-xl border border-sky-200 bg-white px-4 text-[#1f2937]"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="driver@trackgo.app"
              placeholderTextColor="#9ca3af"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View>
            <Text className="mb-2 text-xs font-bold uppercase tracking-[1.5px] text-[#1e3a5f]">
              Mot de passe
            </Text>
            <TextInput
              className="h-12 rounded-xl border border-sky-200 bg-white px-4 text-[#1f2937]"
              secureTextEntry
              placeholder="password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <Pressable
            className="mt-2 h-12 items-center justify-center rounded-xl bg-[#7a2e3b] active:opacity-90"
            onPress={handleLogin}
            disabled={state.isLoading}>
            {state.isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-bold text-white">Se connecter</Text>
            )}
          </Pressable>
        </View>

        <Text className="mt-5 text-center text-xs text-[#1e3a5f]/80">
          Compte de test: driver@trackgo.app / password
        </Text>

        {error ? (
          <View className="mt-4 rounded-lg border border-[#7a2e3b]/35 bg-[#7a2e3b]/10 px-3 py-2">
            <Text className="text-sm text-[#7a2e3b]">{error}</Text>
          </View>
        ) : null}
      </Animated.View>

      <View className="absolute bottom-6">
        <Text className="text-xs font-medium tracking-wide text-sky-100/85">
          Dernier kilomètre, précision maximale.
        </Text>
      </View>
    </View>
  );
}
