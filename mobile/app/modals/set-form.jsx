import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { X, Plus, Calendar, Clock, Layers, Music } from "lucide-react-native";
import { listStages, listSets, createStage, createSet, updateSet } from "../../src/api/lineup";
import { listArtists, createArtist } from "../../src/api/artist";
import { colors } from "../../src/theme/colors";

const pad = (n) => String(n).padStart(2, "0");
const toHM = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

export default function SetFormModal() {
  const { lineupId, setId } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [artists, setArtists] = useState([]);

  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [stageId, setStageId] = useState("");
  const [newStageName, setNewStageName] = useState("");
  const [addingStage, setAddingStage] = useState(false);
  const [artistQuery, setArtistQuery] = useState("");
  const [selectedArtistIds, setSelectedArtistIds] = useState([]);
  const [creatingArtist, setCreatingArtist] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listStages(lineupId), listArtists(), setId ? listSets(lineupId) : Promise.resolve([])])
      .then(([stagesData, artistsData, setsData]) => {
        setStages(stagesData);
        setArtists(artistsData);
        if (setId) {
          const existing = setsData.find((s) => s.id === setId);
          if (existing) {
            setName(existing.name || "");
            const d = new Date(existing.date);
            setDate(d);
            setStartTime(new Date(existing.start_time));
            setEndTime(new Date(existing.end_time));
            setStageId(existing.stage.id);
            setSelectedArtistIds(existing.artists.map((a) => a.id));
          }
        }
      })
      .catch(() => setError("Impossible de charger les données du line-up."))
      .finally(() => setLoading(false));
  }, [lineupId, setId]);

  const selectedArtists = selectedArtistIds
    .map((aid) => artists.find((a) => a.id === aid))
    .filter(Boolean);

  const filteredArtists = artists.filter(
    (a) =>
      a.name.toLowerCase().includes(artistQuery.trim().toLowerCase()) &&
      !selectedArtistIds.includes(a.id),
  );

  const toggleArtist = (aid) => {
    setSelectedArtistIds((prev) =>
      prev.includes(aid) ? prev.filter((x) => x !== aid) : [...prev, aid],
    );
  };

  const handleCreateStage = async () => {
    const label = newStageName.trim();
    if (!label) return;
    try {
      const stage = await createStage(lineupId, label);
      setStages((prev) => (prev.some((s) => s.id === stage.id) ? prev : [...prev, stage]));
      setStageId(stage.id);
      setNewStageName("");
      setAddingStage(false);
    } catch {
      setError("Erreur lors de la création de la scène.");
    }
  };

  const handleCreateArtist = async () => {
    const artistName = artistQuery.trim();
    if (!artistName) return;
    setCreatingArtist(true);
    try {
      const artist = await createArtist({ name: artistName, genres: [] });
      setArtists((prev) => [...prev, artist]);
      setSelectedArtistIds((prev) => [...prev, artist.id]);
      setArtistQuery("");
    } catch {
      setError("Erreur lors de la création de l'artiste.");
    } finally {
      setCreatingArtist(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!stageId) {
      setError("Sélectionnez une scène.");
      return;
    }
    if (toHM(endTime) <= toHM(startTime)) {
      setError("L'heure de fin doit être après l'heure de début.");
      return;
    }
    setSubmitting(true);
    const ymd = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    const payload = {
      name: name.trim() || null,
      artist_ids: selectedArtistIds,
      stage_id: stageId,
      start_time: `${ymd}T${toHM(startTime)}:00`,
      end_time: `${ymd}T${toHM(endTime)}:00`,
      date: `${ymd}T00:00:00`,
    };
    try {
      if (setId) {
        await updateSet(lineupId, setId, payload);
      } else {
        await createSet(lineupId, payload);
      }
      router.back();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0]?.msg : detail || "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100">
        <Text className="text-base font-extrabold text-slate-800">
          {setId ? "Modifier le set" : "Ajouter un set"}
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={20} color={colors.slate400} />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.indigo600} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View style={{ gap: 6 }}>
            <Text className="text-xs font-bold text-slate-500">Nom du set (optionnel)</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="ex: Closing Set"
              placeholderTextColor={colors.slate400}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text className="text-xs font-bold text-slate-500">Date *</Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3"
              style={{ gap: 8 }}
            >
              <Calendar size={15} color={colors.slate400} />
              <Text className="text-sm font-semibold text-slate-800">
                {date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={(e, d) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (d) setDate(d);
                }}
              />
            )}
          </View>

          <View className="flex-row" style={{ gap: 12 }}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text className="text-xs font-bold text-slate-500">Heure début *</Text>
              <Pressable
                onPress={() => setShowStartPicker(true)}
                className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3"
                style={{ gap: 8 }}
              >
                <Clock size={15} color={colors.slate400} />
                <Text className="text-sm font-semibold text-slate-800">{toHM(startTime)}</Text>
              </Pressable>
              {showStartPicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display="default"
                  onChange={(e, d) => {
                    setShowStartPicker(false);
                    if (d) setStartTime(d);
                  }}
                />
              )}
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text className="text-xs font-bold text-slate-500">Heure fin *</Text>
              <Pressable
                onPress={() => setShowEndPicker(true)}
                className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3"
                style={{ gap: 8 }}
              >
                <Clock size={15} color={colors.slate400} />
                <Text className="text-sm font-semibold text-slate-800">{toHM(endTime)}</Text>
              </Pressable>
              {showEndPicker && (
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display="default"
                  onChange={(e, d) => {
                    setShowEndPicker(false);
                    if (d) setEndTime(d);
                  }}
                />
              )}
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Layers size={13} color={colors.indigo600} />
              <Text className="text-xs font-bold text-slate-500">Scène / Lieu *</Text>
            </View>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {stages.map((s) => {
                const selected = stageId === s.id;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setStageId(s.id)}
                    className="rounded-xl px-3.5 py-2.5 border"
                    style={{
                      borderColor: selected ? colors.indigo600 : colors.slate200,
                      backgroundColor: selected ? "#eef2ff" : colors.slate50,
                    }}
                  >
                    <Text
                      className="text-xs font-bold"
                      style={{ color: selected ? colors.indigo700 : colors.slate700 }}
                    >
                      {s.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {addingStage ? (
              <View className="flex-row" style={{ gap: 8 }}>
                <TextInput
                  autoFocus
                  value={newStageName}
                  onChangeText={setNewStageName}
                  placeholder="Nom de la nouvelle scène"
                  placeholderTextColor={colors.slate400}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800"
                />
                <Pressable onPress={handleCreateStage} className="bg-indigo-600 rounded-xl px-3.5 justify-center">
                  <Text className="text-white text-xs font-bold">OK</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => setAddingStage(true)}
                className="flex-row items-center self-start"
                style={{ gap: 4 }}
              >
                <Plus size={13} color={colors.indigo600} />
                <Text className="text-indigo-600 text-[11px] font-bold">Nouvelle scène</Text>
              </Pressable>
            )}
          </View>

          <View style={{ gap: 6 }}>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Music size={13} color={colors.indigo600} />
              <Text className="text-xs font-bold text-slate-500">Artistes</Text>
            </View>
            {selectedArtists.length > 0 && (
              <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                {selectedArtists.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => toggleArtist(a.id)}
                    className="flex-row items-center bg-indigo-50 rounded-lg px-2.5 py-1.5"
                    style={{ gap: 4 }}
                  >
                    <Text className="text-[11px] font-bold text-indigo-600">{a.name}</Text>
                    <X size={11} color={colors.indigo600} />
                  </Pressable>
                ))}
              </View>
            )}
            <TextInput
              value={artistQuery}
              onChangeText={setArtistQuery}
              placeholder="Rechercher ou créer un artiste"
              placeholderTextColor={colors.slate400}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
            />
            {artistQuery.trim().length > 0 && (
              <View className="border border-slate-200 rounded-xl overflow-hidden">
                {filteredArtists.slice(0, 5).map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => {
                      toggleArtist(a.id);
                      setArtistQuery("");
                    }}
                    className="px-3.5 py-2.5 border-b border-slate-100"
                  >
                    <Text className="text-xs font-semibold text-slate-700">{a.name}</Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={handleCreateArtist}
                  className="flex-row items-center px-3.5 py-2.5"
                  style={{ gap: 6 }}
                >
                  {creatingArtist ? (
                    <ActivityIndicator size="small" color={colors.indigo600} />
                  ) : (
                    <Plus size={13} color={colors.indigo600} />
                  )}
                  <Text className="text-xs font-bold text-indigo-600">
                    Créer "{artistQuery.trim()}"
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {error ? <Text className="text-rose-600 text-xs font-semibold">{error}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            className="bg-indigo-600 rounded-xl py-4 items-center"
            style={{ opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-xs font-extrabold uppercase tracking-wide">
                {setId ? "Enregistrer les modifications" : "Ajouter au line-up"}
              </Text>
            )}
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
