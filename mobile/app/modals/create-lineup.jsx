import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Sparkles, Check } from "lucide-react-native";
import { listFestivals } from "../../src/api/festival";
import { createLineup } from "../../src/api/lineup";
import { colors } from "../../src/theme/colors";
import PrimaryButton from "../../src/components/PrimaryButton";
import { HeaderCloseButton } from "../../src/components/nav/HeaderButtons";

export default function CreateLineupModal() {
  const router = useRouter();
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [festivalId, setFestivalId] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listFestivals()
      .then((data) => setFestivals(Array.isArray(data) ? data : []))
      .catch(() => setError("Impossible de charger les festivals."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!festivalId) {
      setError("Sélectionnez un festival.");
      return;
    }
    setSubmitting(true);
    try {
      const lineup = await createLineup(festivalId, name.trim());
      router.replace(`/lineups/${lineup.id}`);
    } catch {
      setError("Erreur lors de la création de la lineup.");
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom", "left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Nouvelle Lineup",
          headerRight: () => <HeaderCloseButton onPress={() => router.back()} />,
        }}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.indigo600} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View className="items-center py-4">
            <View className="bg-indigo-50 rounded-2xl p-4 mb-2">
              <Sparkles color={colors.indigo600} size={24} />
            </View>
            <Text className="text-xs text-slate-500 text-center px-6">
              Créez votre programmation personnelle pour un festival, à partager
              avec qui vous voulez.
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text className="text-xs font-bold text-slate-500">Festival *</Text>
            {festivals.map((f) => {
              const selected = festivalId === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => setFestivalId(f.id)}
                  className="flex-row items-center justify-between rounded-xl border px-4 py-3"
                  style={{
                    borderColor: selected ? colors.indigo600 : colors.slate200,
                    backgroundColor: selected ? "#eef2ff" : colors.slate50,
                  }}
                >
                  <Text
                    className="text-sm font-semibold flex-1"
                    style={{ color: selected ? colors.indigo700 : colors.slate700 }}
                    numberOfLines={1}
                  >
                    {f.name} — {f.location}
                  </Text>
                  {selected && <Check size={16} color={colors.indigo600} />}
                </Pressable>
              );
            })}
          </View>

          <View style={{ gap: 6 }}>
            <Text className="text-xs font-bold text-slate-500">Nom de la lineup (optionnel)</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="ex: Ma programmation weekend"
              placeholderTextColor={colors.slate400}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
            />
          </View>

          {error ? <Text className="text-rose-600 text-xs font-semibold">{error}</Text> : null}

          <PrimaryButton label="Créer la lineup" onPress={handleSubmit} loading={submitting} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
