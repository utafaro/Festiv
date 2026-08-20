import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { MapPin } from "lucide-react-native";
import { pingGeo } from "../../src/api/suivi";
import { colors } from "../../src/theme/colors";
import PrimaryButton from "../../src/components/PrimaryButton";
import { HeaderCloseButton } from "../../src/components/nav/HeaderButtons";

export default function GeoPingModal() {
  const { suiviId } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Autorisez l'accès à votre position pour la partager.");
        setLoading(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch {
        setError("Impossible de récupérer votre position.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleConfirm = async () => {
    if (!coords) return;
    setSubmitting(true);
    setError("");
    try {
      await pingGeo(suiviId, { lat: coords.latitude, lng: coords.longitude });
      router.back();
    } catch {
      setError("Erreur lors du partage de votre position.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["bottom", "left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Ma position",
          headerRight: () => <HeaderCloseButton onPress={() => router.back()} />,
        }}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.fuchsia600} />
        </View>
      ) : !coords ? (
        <View className="flex-1 items-center justify-center px-6" style={{ gap: 12 }}>
          <MapPin size={28} color={colors.slate400} />
          <Text className="text-sm text-slate-500 text-center">{error}</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Text className="text-xs text-slate-500 text-center py-3 px-6">
            Ajustez le repère si besoin, puis validez pour partager votre position avec le suivi.
          </Text>
          <MapView
            style={StyleSheet.absoluteFillObject}
            initialRegion={{
              latitude: coords.latitude,
              longitude: coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={coords}
              draggable
              onDragEnd={(e) => setCoords(e.nativeEvent.coordinate)}
              pinColor={colors.fuchsia600}
            />
          </MapView>
          <View className="p-4 bg-white" style={{ gap: 8 }}>
            {error ? <Text className="text-rose-600 text-xs font-semibold">{error}</Text> : null}
            <PrimaryButton
              label="Partager ma position"
              onPress={handleConfirm}
              loading={submitting}
              tintColor={colors.fuchsia600}
            />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
