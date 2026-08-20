import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, Image as ImageIcon, Trash2 } from "lucide-react-native";
import { getFestivalById, updateFestival } from "../../src/api/festival";
import { API_BASE_URL } from "../../src/api/config";
import { colors } from "../../src/theme/colors";
import PrimaryButton from "../../src/components/PrimaryButton";
import { HeaderCloseButton } from "../../src/components/nav/HeaderButtons";

export default function EditFestivalModal() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [genres, setGenres] = useState("");
  const [tags, setTags] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [existingCoverUrl, setExistingCoverUrl] = useState(null);
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getFestivalById(id)
      .then((f) => {
        setName(f.name || "");
        setLocation(f.location || "");
        setGenres((f.genres || []).join(", "));
        setTags((f.tags || []).join(", "));
        setStartDate(new Date(f.start_date));
        setEndDate(new Date(f.end_date));
        setExistingCoverUrl(f.cover_image_url || null);
      })
      .catch(() => setError("Impossible de charger le festival."))
      .finally(() => setLoading(false));
  }, [id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImage({ uri: asset.uri, name: asset.fileName || "cover.jpg", type: asset.mimeType || "image/jpeg" });
      setExistingCoverUrl(null);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!name || !location) {
      setError("Merci de remplir au moins le nom et le lieu.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name,
        location,
        genres: genres ? genres.split(",").map((g) => g.trim()).filter(Boolean) : [],
        tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      };
      await updateFestival(id, payload, image);
      router.back();
    } catch {
      setError("Erreur lors de la modification du festival.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  const coverPreview = image?.uri || (existingCoverUrl ? `${API_BASE_URL}${existingCoverUrl}` : null);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color={colors.indigo600} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom", "left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Modifier le Festival",
          headerRight: () => <HeaderCloseButton onPress={() => router.back()} />,
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6 }}>
          <Text className="text-xs font-bold text-slate-500">Nom du Festival *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.slate400}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text className="text-xs font-bold text-slate-500">Lieu *</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholderTextColor={colors.slate400}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
          />
        </View>

        <View className="flex-row" style={{ gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text className="text-xs font-bold text-slate-500">Date de Début</Text>
            <Pressable
              onPress={() => setShowStartPicker(true)}
              className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3"
              style={{ gap: 8 }}
            >
              <Calendar size={15} color={colors.slate400} />
              <Text className="text-sm font-semibold text-slate-800">{formatDate(startDate)}</Text>
            </Pressable>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text className="text-xs font-bold text-slate-500">Date de Fin</Text>
            <Pressable
              onPress={() => setShowEndPicker(true)}
              className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3"
              style={{ gap: 8 }}
            >
              <Calendar size={15} color={colors.slate400} />
              <Text className="text-sm font-semibold text-slate-800">{formatDate(endDate)}</Text>
            </Pressable>
          </View>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(e, d) => {
              setShowStartPicker(Platform.OS === "ios");
              if (d) setStartDate(d);
            }}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(e, d) => {
              setShowEndPicker(Platform.OS === "ios");
              if (d) setEndDate(d);
            }}
          />
        )}

        <View style={{ gap: 6 }}>
          <Text className="text-xs font-bold text-slate-500">Image de couverture</Text>
          {coverPreview ? (
            <View className="rounded-2xl overflow-hidden border border-slate-200 h-32">
              <Image source={{ uri: coverPreview }} className="w-full h-full" resizeMode="cover" />
              <Pressable
                onPress={() => {
                  setImage(null);
                  setExistingCoverUrl(null);
                }}
                className="absolute top-2 right-2 bg-rose-600 rounded-lg p-2"
              >
                <Trash2 size={14} color="white" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={pickImage}
              className="border-2 border-dashed border-slate-200 rounded-2xl py-8 items-center"
              style={{ gap: 8 }}
            >
              <View className="bg-indigo-50 rounded-xl p-3">
                <ImageIcon size={18} color={colors.indigo600} />
              </View>
              <Text className="text-xs font-bold text-slate-700">Importer une image</Text>
            </Pressable>
          )}
        </View>

        <View style={{ gap: 6 }}>
          <Text className="text-xs font-bold text-slate-500">Genres (séparés par virgule)</Text>
          <TextInput
            value={genres}
            onChangeText={setGenres}
            placeholderTextColor={colors.slate400}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text className="text-xs font-bold text-slate-500">Tags (séparés par virgule)</Text>
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholderTextColor={colors.slate400}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
          />
        </View>

        {error ? <Text className="text-rose-600 text-xs font-semibold">{error}</Text> : null}

        <PrimaryButton
          label="Enregistrer les modifications"
          onPress={handleSubmit}
          loading={submitting}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
