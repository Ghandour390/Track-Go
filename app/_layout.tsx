import { Stack } from "expo-router";
import React from "react";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ParcelsProvider } from "@/hooks/use-parcels";

function AppNavigator() {
  const { state } = useAuth();

  if (state.isLoading) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ParcelsProvider>
        <AppNavigator />
      </ParcelsProvider>
    </AuthProvider>
  );
}
