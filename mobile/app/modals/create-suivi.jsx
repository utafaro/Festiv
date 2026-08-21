import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Radar, Check } from "lucide-react-native";
import { listFestivals } from "../../src/api/festival";
import { listMyLineups, listSharedLineups } from "../../src/api/lineup";
import { createSuivi } from "../../src/api/suivi";
import { colors } from "../../src/theme/colors";
import PrimaryButton from "../../src/components/PrimaryButton";
import { HeaderCloseButton } from "../../src/components/nav/HeaderButtons";

export default function CreateSuiviModal() {
  const router = useRouter();
  const [festivals, setFestivals] = useState([]);
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [festivalId, setFestivalId] = useState("");
  const [lineupIds, setLineupIds] = useState([]);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listFestivals(), listMyLineups(), listSharedLineups()])
      .then(([festivalsData, mine, shared]) => {
        setFestivals(Array.isArray(festivalsData) ? festivalsData : []);
        setLineups([...(mine || []), ...(shared || [])]);
      })
      .catch(() => setError("Impossible de charger vos lineups."))
      .finally(() => setLoading(false));
  }, []);

  const availableLineups = lineups.filter((l) => l.festival_id === festivalId);

  const toggleLineup = (lid) => {
    setLineupIds((prev) => (prev.includes(lid) ? prev.filter((x) => x !== lid) : [...prev, lid]));
  };

  const handleSubmit = async () => {
    if (!festivalId) {
      setError("Sélectionnez un festival.");
      return;
    }
    if (lineupIds.length === 0) {
      setError("Sélectionnez au moins une lineup.");
      return;
    }
    setSubmitting(true);
    try {
      const suivi = await createSuivi(festivalId, lineupIds, name.trim());
      router.replace(`/suivi/${suivi.id}`);
    } catch {
      setError("Erreur lors de la création du suivi.");
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom", "left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Nouveau Suivi",
          headerRight: () => <HeaderCloseButton onPress={() => router.back()} />,
        }}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.fuchsia600} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View className="items-center py-4">
            <View className="bg-fuchsia-50 rounded-2xl p-4 mb-2">
              <Radar color={colors.fuchsia600} size={24} />
            </View>
            <Text className="text-xs text-slate-500 text-center px-6">
              Repérez-vous en direct avec vos amis pendant le festival.
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text className="text-xs font-bold text-slate-500">Festival *</Text>
            {festivals.map((f) => {
              const selected = festivalId === f.id;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => {
                    setFestivalId(f.id);
                    setLineupIds([]);
                  }}
                  className="flex-row items-center justify-between rounded-xl border px-4 py-3"
                  style={{
                    borderColor: selected ? colors.fuchsia600 : colors.slate200,
                    backgroundColor: selected ? "#fdf4ff" : colors.slate50,
                  }}
                >
                  <Text
                    className="text-sm font-semibold flex-1"
                    style={{ color: selected ? colors.fuchsia700 : colors.slate700 }}
                    numberOfLines={1}
                  >
                    {f.name} — {f.location}
                  </Text>
                  {selected && <Check size={16} color={colors.fuchsia600} />}
                </Pressable>
              );
            })}
          </View>

          {festivalId && (
            <View style={{ gap: 6 }}>
              <Text className="text-xs font-bold text-slate-500">Lineup(s) à suivre *</Text>
              {availableLineups.length === 0 ? (
                <Text className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  Aucune lineup disponible pour ce festival. Créez-en une d'abord.
                </Text>
              ) : (
                availableLineups.map((l) => {
                  const selected = lineupIds.includes(l.id);
                  return (
                    <Pressable
                      key={l.id}
                      onPress={() => toggleLineup(l.id)}
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
                        {l.name || "Lineup sans nom"}
                      </Text>
                      {selected && <Check size={16} color={colors.indigo600} />}
                    </Pressable>
                  );
                })
              )}
            </View>
          )}

          <View style={{ gap: 6 }}>
            <Text className="text-xs font-bold text-slate-500">Nom du suivi (optionnel)</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="ex: Notre weekend"
              placeholderTextColor={colors.slate400}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
            />
          </View>

          {error ? <Text className="text-rose-600 text-xs font-semibold">{error}</Text> : null}

          <PrimaryButton
            label="Créer le suivi"
            onPress={handleSubmit}
            loading={submitting}
            tintColor={colors.fuchsia600}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
