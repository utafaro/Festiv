import { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, ActivityIndicator, Pressable, Linking } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import {
  Calendar,
  MapPin,
  Music,
  ExternalLink,
  Radio,
  Plus,
  ArrowUpRight,
} from "lucide-react-native";
import { HeaderIconButton, HeaderTextButton } from "../../../../src/components/nav/HeaderButtons";
import { getFestivalById } from "../../../../src/api/festival";
import { listMyLineups, createLineup } from "../../../../src/api/lineup";
import { API_BASE_URL } from "../../../../src/api/config";
import { colors } from "../../../../src/theme/colors";
import GlassCard from "../../../../src/components/GlassCard";

export default function FestivalDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [festival, setFestival] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState({ latitude: 46.603354, longitude: 1.888334 });
  const [mapLoading, setMapLoading] = useState(true);
  const [myLineup, setMyLineup] = useState(null);
  const [lineupLoading, setLineupLoading] = useState(true);
  const [creatingLineup, setCreatingLineup] = useState(false);

  useEffect(() => {
    if (!id) return;
    getFestivalById(id)
      .then(setFestival)
      .catch(() => {})
      .finally(() => setLoading(false));

    listMyLineups()
      .then((lineups) => setMyLineup(lineups.find((l) => l.festival_id === id) || null))
      .catch(() => {})
      .finally(() => setLineupLoading(false));
  }, [id]);

  useEffect(() => {
    if (!festival?.location) return;
    setMapLoading(true);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(festival.location)}&limit=1`;
    fetch(url, { headers: { "User-Agent": "FestivMobile/1.0" } })
      .then((r) => r.json())
      .then((data) => {
        if (data?.[0]) {
          setCoordinates({ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) });
        }
      })
      .catch(() => {})
      .finally(() => setMapLoading(false));
  }, [festival?.location]);

  const handleCreateLineup = async () => {
    setCreatingLineup(true);
    try {
      const lineup = await createLineup(id, null);
      router.push(`/lineups/${lineup.id}`);
    } catch {
      setCreatingLineup(false);
    }
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "";

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color={colors.indigo600} />
      </SafeAreaView>
    );
  }

  if (!festival) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center px-6">
        <Text className="text-slate-700 font-semibold text-base text-center mb-4">
          Le festival demandé est introuvable.
        </Text>
        <Pressable onPress={() => router.back()} className="bg-indigo-600 rounded-xl px-4 py-2.5">
          <Text className="text-white text-sm font-semibold">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const coverUri = festival.cover_image_url
    ? festival.cover_image_url.startsWith("http")
      ? festival.cover_image_url
      : `${API_BASE_URL}${festival.cover_image_url}`
    : null;

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={[]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackTitle: "Retour",
          headerTitle: "",
          unstable_headerRightItems: () => [
            {
              type: "custom",
              hidesSharedBackground: true,
              element: (
                <HeaderIconButton
                  systemImage="pencil"
                  accessibilityLabel="Modifier"
                  onPress={() => router.push(`/modals/edit-festival?id=${id}`)}
                />
              ),
            },
            ...(festival.ticket_office_url
              ? [
                  {
                    type: "custom",
                    hidesSharedBackground: true,
                    element: (
                      <HeaderTextButton
                        label="Billetterie"
                        systemImage="ticket.fill"
                        onPress={() => Linking.openURL(festival.ticket_office_url)}
                        prominent
                      />
                    ),
                  },
                ]
              : []),
          ],
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100, gap: 16 }}>
        <View className="rounded-3xl overflow-hidden bg-slate-200 h-56">
          {coverUri ? (
            <Image source={{ uri: coverUri }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Music size={40} color={colors.slate400} />
            </View>
          )}
          <View className="absolute bottom-0 left-0 right-0 p-4 bg-black/40">
            <Text className="text-white text-xl font-extrabold">{festival.name}</Text>
            <View className="flex-row items-center mt-1" style={{ gap: 4 }}>
              <MapPin size={12} color="white" />
              <Text className="text-white text-xs">{festival.location}</Text>
            </View>
          </View>
        </View>

        <GlassCard className="p-5">
          <View className="flex-row items-center mb-3" style={{ gap: 10 }}>
            <View className="bg-fuchsia-50 rounded-xl p-2">
              <Radio size={18} color={colors.fuchsia600} />
            </View>
            <Text className="text-base font-bold text-slate-900">Line-up & Programmation</Text>
          </View>
          <Text className="text-xs text-slate-500 mb-4">
            Créez votre programmation personnelle pour ce festival, à partager avec vos amis.
          </Text>

          {lineupLoading ? (
            <ActivityIndicator color={colors.indigo600} />
          ) : myLineup ? (
            <Pressable
              onPress={() => router.push(`/lineups/${myLineup.id}`)}
              className="flex-row items-center justify-center bg-indigo-600 rounded-xl py-3"
              style={{ gap: 6 }}
            >
              <Text className="text-white text-xs font-bold">Voir ma Lineup</Text>
              <ArrowUpRight size={14} color="white" />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleCreateLineup}
              disabled={creatingLineup}
              className="flex-row items-center justify-center bg-indigo-600 rounded-xl py-3"
              style={{ gap: 6, opacity: creatingLineup ? 0.6 : 1 }}
            >
              {creatingLineup ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Plus size={14} color="white" />
              )}
              <Text className="text-white text-xs font-bold">Créer ma Lineup</Text>
            </Pressable>
          )}
        </GlassCard>

        <GlassCard className="p-5" style={{ gap: 14 }}>
          <Text className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
            Informations
          </Text>
          <View className="flex-row items-start" style={{ gap: 12 }}>
            <View className="bg-indigo-50 rounded-xl p-2.5">
              <Calendar size={16} color={colors.indigo600} />
            </View>
            <View>
              <Text className="text-[10px] font-bold text-slate-400 uppercase">Dates</Text>
              <Text className="text-sm font-semibold text-slate-800 mt-0.5">
                Du {formatDate(festival.start_date)}
              </Text>
              <Text className="text-sm font-semibold text-slate-800">
                Au {formatDate(festival.end_date)}
              </Text>
            </View>
          </View>

          {festival.genres?.length > 0 && (
            <View>
              <Text className="text-[10px] font-bold text-slate-400 uppercase mb-2">Genres</Text>
              <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                {festival.genres.map((genre, idx) => (
                  <View key={idx} className="bg-indigo-50 rounded-lg px-2.5 py-1">
                    <Text className="text-[10px] font-bold text-indigo-600">{genre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {festival.main_page_url && (
            <Pressable
              onPress={() => Linking.openURL(festival.main_page_url)}
              className="flex-row items-center"
              style={{ gap: 6 }}
            >
              <ExternalLink size={13} color={colors.indigo600} />
              <Text className="text-xs font-bold text-indigo-600">Site officiel</Text>
            </Pressable>
          )}
        </GlassCard>

        <GlassCard className="p-4" style={{ gap: 10 }}>
          <Text className="text-sm font-bold text-slate-900">Plan d'accès</Text>
          <View className="h-52 rounded-2xl overflow-hidden">
            {mapLoading ? (
              <View className="flex-1 items-center justify-center bg-slate-100">
                <ActivityIndicator color={colors.indigo600} />
              </View>
            ) : (
              <MapView
                style={{ flex: 1 }}
                region={{
                  ...coordinates,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
              >
                <Marker coordinate={coordinates} title={festival.name} description={festival.location} />
              </MapView>
            )}
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
