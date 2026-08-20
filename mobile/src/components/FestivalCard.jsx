import { View, Text, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { MapPin, Calendar, Music, ImageIcon } from "lucide-react-native";
import { API_BASE_URL } from "../api/config";
import { colors } from "../theme/colors";
import GlassCard from "./GlassCard";

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function FestivalCard({ festival }) {
  const router = useRouter();
  const coverUri = festival.cover_image_url
    ? festival.cover_image_url.startsWith("http")
      ? festival.cover_image_url
      : `${API_BASE_URL}${festival.cover_image_url}`
    : null;

  return (
    <Pressable
      onPress={() => router.push(`/festival/${festival.id}`)}
      className="mb-4 active:opacity-90"
    >
    <GlassCard>
      <View className="h-40 bg-slate-100">
        {coverUri ? (
          <Image source={{ uri: coverUri }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <ImageIcon color={colors.slate400} size={28} />
          </View>
        )}
      </View>

      <View className="p-4">
        <Text className="text-base font-extrabold text-slate-800" numberOfLines={1}>
          {festival.name}
        </Text>

        <View className="flex-row items-center mt-1.5" style={{ gap: 6 }}>
          <MapPin size={13} color={colors.slate400} />
          <Text className="text-xs font-semibold text-slate-500 flex-1" numberOfLines={1}>
            {festival.location}
          </Text>
        </View>

        {festival.genres?.length > 0 && (
          <View className="flex-row flex-wrap mt-2.5" style={{ gap: 6 }}>
            {festival.genres.slice(0, 3).map((genre, idx) => (
              <View
                key={idx}
                className="flex-row items-center bg-indigo-50 rounded-lg px-2 py-1"
                style={{ gap: 4 }}
              >
                <Music size={10} color={colors.indigo600} />
                <Text className="text-[10px] font-bold text-indigo-600">{genre}</Text>
              </View>
            ))}
          </View>
        )}

        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <Calendar size={11} color={colors.slate400} />
            <Text className="text-[10px] font-medium text-slate-400">
              Du {formatDate(festival.start_date)}
            </Text>
          </View>
          <Text className="text-[10px] font-medium text-slate-400">
            Au {formatDate(festival.end_date)}
          </Text>
        </View>
      </View>
    </GlassCard>
    </Pressable>
  );
}
