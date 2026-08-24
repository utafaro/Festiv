import "../global.css";
import { Stack } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { colors } from "../src/theme/colors";

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color={colors.indigo600} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="modals/add-festival"
          options={{ presentation: "modal", headerShown: true }}
        />
        <Stack.Screen
          name="modals/edit-festival"
          options={{ presentation: "modal", headerShown: true }}
        />
        <Stack.Screen
          name="modals/create-lineup"
          options={{ presentation: "modal", headerShown: true }}
        />
        <Stack.Screen
          name="modals/create-suivi"
          options={{ presentation: "modal", headerShown: true }}
        />
        <Stack.Screen
          name="modals/set-form"
          options={{ presentation: "modal", headerShown: true }}
        />
        <Stack.Screen
          name="modals/position-form"
          options={{ presentation: "modal", headerShown: true }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
