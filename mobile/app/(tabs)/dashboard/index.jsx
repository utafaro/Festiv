import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useFocusEffect, useRouter } from "expo-router";
import { Plus, Sparkles } from "lucide-react-native";
import FestivalCard from "../../../src/components/FestivalCard";
import ToastStack from "../../../src/components/ToastStack";
import { HeaderAvatarButton } from "../../../src/components/nav/HeaderButtons";
import { useToasts } from "../../../src/hooks/useToasts";
import { useAuth } from "../../../src/context/AuthContext";
import { useSettingsSheet } from "../../../src/context/SettingsSheetContext";
import { getInitials } from "../../../src/utils/getInitials";
import { listFestivals } from "../../../src/api/festival";
import { colors } from "../../../src/theme/colors";

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { show: showSettings } = useSettingsSheet();
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toasts, triggerToast] = useToasts();

  const load = useCallback(async () => {
    try {
      const data = await listFestivals();
      setFestivals(Array.isArray(data) ? data : []);
    } catch {
      triggerToast("Impossible de charger la liste des festivals.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [triggerToast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={[]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "FESTIV",
          headerRight: () => (
            <HeaderAvatarButton initials={getInitials(user?.full_name)} onPress={showSettings} />
          ),
        }}
      />

      <View className="px-4 pt-5 pb-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-xl font-extrabold text-slate-900">
              Mon Agenda Festivals
            </Text>
            <Text className="text-xs text-slate-500 mt-1">
              Planifiez et suivez vos festivals.
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/modals/add-festival")}
            className="bg-indigo-600 rounded-xl px-3.5 py-2.5 flex-row items-center active:opacity-80"
            style={{ gap: 6 }}
          >
            <Plus size={16} color="white" />
            <Text className="text-white text-xs font-bold">Ajouter</Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.indigo600} />
        </View>
      ) : festivals.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="bg-indigo-50 rounded-2xl p-4 mb-4">
            <Sparkles color={colors.indigo600} size={26} />
          </View>
          <Text className="text-sm font-bold text-slate-800 text-center">
            Aucun festival programmé
          </Text>
          <Text className="text-xs text-slate-500 text-center mt-1">
            Commencez à planifier votre été dès maintenant !
          </Text>
        </View>
      ) : (
        <FlatList
          data={festivals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <FestivalCard festival={item} />}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <ToastStack toasts={toasts} />
    </SafeAreaView>
  );
}
