import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { X, MapPin, Image as ImageIcon, Calendar, Trash2 } from "lucide-react-native";
import { createFestival } from "../../src/api/festival";
import { colors } from "../../src/theme/colors";

export default function AddFestivalModal() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [location, setLocation] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [genres, setGenres] = useState("");
  const [tags, setTags] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef(null);

  const handleLocationChange = (value) => {
    setLocationQuery(value);
    setLocation(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&featuretype=settlement&addressdetails=1&limit=5&accept-language=fr`;
        const res = await fetch(url, { headers: { "User-Agent": "FestivMobile/1.0" } });
        const data = await res.json();
        const formatted = data.map((item) => {
          const city =
            item.address.city || item.address.town || item.address.village || item.display_name.split(",")[0];
          const country = item.address.country;
          return { id: item.place_id, label: `${city}, ${country}` };
        });
        const unique = formatted.filter((v, i, a) => a.findIndex((t) => t.label === v.label) === i);
        setSuggestions(unique);
      } catch {
        // silencieux : l'utilisateur peut toujours taper l'adresse manuellement
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        name: asset.fileName || "cover.jpg",
        type: asset.mimeType || "image/jpeg",
      });
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!name || !location || !startDate || !endDate) {
      setError("Merci de remplir au moins le nom, le lieu et les dates.");
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
        main_page_url: null,
        ticket_office_url: null,
        akkros_url: null,
        merch_url: null,
      };
      await createFestival(payload, image);
      router.back();
    } catch {
      setError("Erreur lors de la création du festival.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) =>
    d ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "Sélectionner";

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100">
        <Text className="text-base font-extrabold text-slate-800">Nouveau Festival</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={20} color={colors.slate400} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6 }}>
          <Text className="text-xs font-bold text-slate-500">Nom du Festival *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="ex: We Love Green"
            placeholderTextColor={colors.slate400}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text className="text-xs font-bold text-slate-500">Lieu / Destination *</Text>
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5">
            <MapPin size={15} color={colors.slate400} />
            <TextInput
              value={locationQuery}
              onChangeText={handleLocationChange}
              placeholder="ex: Paris, France"
              placeholderTextColor={colors.slate400}
              className="flex-1 py-3 px-2.5 text-sm text-slate-800"
            />
            {searching && <ActivityIndicator size="small" color={colors.indigo600} />}
          </View>
          {suggestions.length > 0 && (
            <View className="border border-slate-200 rounded-xl overflow-hidden">
              {suggestions.map((city) => (
                <Pressable
                  key={city.id}
                  onPress={() => {
                    setLocationQuery(city.label);
                    setLocation(city.label);
                    setSuggestions([]);
                  }}
                  className="flex-row items-center px-3.5 py-2.5 border-b border-slate-100 active:bg-slate-50"
                  style={{ gap: 8 }}
                >
                  <MapPin size={13} color={colors.slate400} />
                  <Text className="text-xs font-semibold text-slate-600 flex-1">{city.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View className="flex-row" style={{ gap: 12 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text className="text-xs font-bold text-slate-500">Date de Début *</Text>
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
            <Text className="text-xs font-bold text-slate-500">Date de Fin *</Text>
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
            value={startDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(event, date) => {
              setShowStartPicker(Platform.OS === "ios");
              if (date) setStartDate(date);
            }}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(event, date) => {
              setShowEndPicker(Platform.OS === "ios");
              if (date) setEndDate(date);
            }}
          />
        )}

        <View style={{ gap: 6 }}>
          <Text className="text-xs font-bold text-slate-500">Image de couverture</Text>
          {image ? (
            <View className="rounded-2xl overflow-hidden border border-slate-200 h-32">
              <Image source={{ uri: image.uri }} className="w-full h-full" resizeMode="cover" />
              <Pressable
                onPress={() => setImage(null)}
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
            placeholder="ex: Electronic, Pop, Rock"
            placeholderTextColor={colors.slate400}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text className="text-xs font-bold text-slate-500">Tags (séparés par virgule)</Text>
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder="ex: Camping, Eco, Beach"
            placeholderTextColor={colors.slate400}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800"
          />
        </View>

        {error ? <Text className="text-rose-600 text-xs font-semibold">{error}</Text> : null}

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          className="bg-indigo-600 rounded-xl py-4 items-center active:opacity-80"
          style={{ opacity: submitting ? 0.6 : 1 }}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-xs font-extrabold uppercase tracking-wide">
              Créer le festival
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
