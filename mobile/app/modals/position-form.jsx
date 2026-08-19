import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { X, MapPin, Music, Plus, Users } from "lucide-react-native";
import {
  listSuiviSets,
  listSpots,
  listPositions,
  createSpot,
  setPosition,
} from "../../src/api/suivi";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

export default function PositionFormModal() {
  const params = useLocalSearchParams();
  const { suiviId, targetType: qTargetType, setId: qSetId, customSpotId: qCustomSpotId, groupedWith } =
    params;
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [sets, setSets] = useState([]);
  const [spots, setSpots] = useState([]);
  const [otherPositions, setOtherPositions] = useState([]);

  const [mode, setMode] = useState(qTargetType || "set");
  const [selectedSetId, setSelectedSetId] = useState(qSetId || "");
  const [selectedSpotId, setSelectedSpotId] = useState(qCustomSpotId || "");
  const [newSpotLabel, setNewSpotLabel] = useState("");
  const [creatingSpot, setCreatingSpot] = useState(false);
  const [note, setNote] = useState("");
  const [selectedGrouped, setSelectedGrouped] = useState(() => {
    try {
      return groupedWith ? JSON.parse(groupedWith) : [];
    } catch {
      return [];
    }
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listSuiviSets(suiviId), listSpots(suiviId), listPositions(suiviId)])
      .then(([setsData, spotsData, positionsData]) => {
        setSets(setsData);
        setSpots(spotsData);
        setOtherPositions(positionsData.filter((p) => p.user_id !== user?.id));
      })
      .catch(() => setError("Impossible de charger les données du suivi."))
      .finally(() => setLoading(false));
  }, [suiviId, user?.id]);

  const toggleGrouped = (uid) => {
    setSelectedGrouped((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));
  };

  const handleCreateSpot = async () => {
    const label = newSpotLabel.trim();
    if (!label) return;
    setCreatingSpot(true);
    try {
      const spot = await createSpot(suiviId, label);
      setSpots((prev) => (prev.some((s) => s.id === spot.id) ? prev : [...prev, spot]));
      setSelectedSpotId(spot.id);
      setNewSpotLabel("");
    } catch {
      setError("Erreur lors de la création du lieu personnalisé.");
    } finally {
      setCreatingSpot(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (mode === "set" && !selectedSetId) {
      setError("Sélectionnez le set sur lequel vous vous trouvez.");
      return;
    }
    if (mode === "custom" && !selectedSpotId) {
      setError("Sélectionnez ou créez un lieu personnalisé.");
      return;
    }
    setSubmitting(true);
    try {
      await setPosition(suiviId, {
        target_type: mode,
        set_id: mode === "set" ? selectedSetId : null,
        custom_spot_id: mode === "custom" ? selectedSpotId : null,
        note: note.trim() || null,
        grouped_with: selectedGrouped,
      });
      router.back();
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la mise à jour de votre position.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100">
        <Text className="text-base font-extrabold text-slate-800">Où êtes-vous ?</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={20} color={colors.slate400} />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.fuchsia600} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View className="flex-row bg-slate-100 rounded-xl p-1">
            <Pressable
              onPress={() => setMode("set")}
              className="flex-1 py-2.5 rounded-lg items-center"
              style={{ backgroundColor: mode === "set" ? "white" : "transparent" }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: mode === "set" ? colors.indigo600 : colors.slate500 }}
              >
                Sur un set
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode("custom")}
              className="flex-1 py-2.5 rounded-lg items-center"
              style={{ backgroundColor: mode === "custom" ? "white" : "transparent" }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: mode === "custom" ? colors.fuchsia600 : colors.slate500 }}
              >
                Ailleurs
              </Text>
            </Pressable>
          </View>

          {mode === "set" ? (
            <View style={{ gap: 8 }}>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Music size={13} color={colors.indigo600} />
                <Text className="text-xs font-bold text-slate-500">Set *</Text>
              </View>
              {sets.length === 0 ? (
                <Text className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  Aucun set programmé dans les lineups de ce suivi.
                </Text>
              ) : (
                sets.map((s) => {
                  const selected = selectedSetId === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      onPress={() => setSelectedSetId(s.id)}
                      className="rounded-xl border px-4 py-3"
                      style={{
                        borderColor: selected ? colors.indigo600 : colors.slate200,
                        backgroundColor: selected ? "#eef2ff" : colors.slate50,
                      }}
                    >
                      <Text
                        className="text-sm font-semibold"
                        style={{ color: selected ? colors.indigo700 : colors.slate700 }}
                      >
                        {s.name || s.artists.map((a) => a.name).join(" B2B ") || "Set"}
                      </Text>
                      <Text className="text-[11px] text-slate-500 mt-0.5">
                        {s.stage.name} — {s.start_time.slice(11, 16)}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <MapPin size={13} color={colors.fuchsia600} />
                <Text className="text-xs font-bold text-slate-500">Lieu personnalisé *</Text>
              </View>
              {spots.map((s) => {
                const selected = selectedSpotId === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setSelectedSpotId(s.id)}
                    className="rounded-xl border px-4 py-3"
                    style={{
                      borderColor: selected ? colors.fuchsia600 : colors.slate200,
                      backgroundColor: selected ? "#fdf4ff" : colors.slate50,
                    }}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: selected ? colors.fuchsia700 : colors.slate700 }}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
              <View className="flex-row" style={{ gap: 8 }}>
                <TextInput
                  value={newSpotLabel}
                  onChangeText={setNewSpotLabel}
                  placeholder="ex: Devant les foodtrucks"
                  placeholderTextColor={colors.slate400}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                />
                <Pressable
                  onPress={handleCreateSpot}
                  disabled={creatingSpot}
                  className="bg-fuchsia-600 rounded-xl px-3.5 flex-row items-center justify-center"
                  style={{ gap: 4 }}
                >
                  {creatingSpot ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Plus size={14} color="white" />
                  )}
                  <Text className="text-white text-xs font-bold">Créer</Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={{ gap: 6 }}>
            <Text className="text-xs font-bold text-slate-500">Note (optionnel)</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="ex: Devant la barrière côté droit"
              placeholderTextColor={colors.slate400}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
            />
          </View>

          {otherPositions.length > 0 && (
            <View style={{ gap: 8 }}>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Users size={13} color={colors.indigo600} />
                <Text className="text-xs font-bold text-slate-500">Vous êtes avec :</Text>
              </View>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {otherPositions.map((p) => {
                  const selected = selectedGrouped.includes(p.user_id);
                  return (
                    <Pressable
                      key={p.user_id}
                      onPress={() => toggleGrouped(p.user_id)}
                      className="rounded-lg px-2.5 py-1.5 border"
                      style={{
                        borderColor: selected ? colors.indigo600 : colors.slate200,
                        backgroundColor: selected ? "#eef2ff" : colors.slate50,
                      }}
                    >
                      <Text
                        className="text-[11px] font-bold"
                        style={{ color: selected ? colors.indigo700 : colors.slate600 }}
                      >
                        {p.full_name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {error ? <Text className="text-rose-600 text-xs font-semibold">{error}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            className="bg-fuchsia-600 rounded-xl py-4 items-center"
            style={{ opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-xs font-extrabold uppercase tracking-wide">
                Valider ma position
              </Text>
            )}
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
