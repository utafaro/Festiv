import { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import { Navigation, MapPinOff } from "lucide-react-native";
import { listPositions } from "../../src/api/suivi";
import { useSuiviSocket } from "../../src/hooks/useSuiviSocket";
import { colors } from "../../src/theme/colors";
import { HeaderCloseButton } from "../../src/components/nav/HeaderButtons";

const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

function bearingBetween(from, to) {
  const y = Math.sin(toRad(to.longitude - from.longitude)) * Math.cos(toRad(to.latitude));
  const x =
    Math.cos(toRad(from.latitude)) * Math.sin(toRad(to.latitude)) -
    Math.sin(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.cos(toRad(to.longitude - from.longitude));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function distanceBetween(from, to) {
  const R = 6371000;
  const dLat = toRad(to.latitude - from.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatAgo(iso) {
  if (!iso) return "";
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  return `il y a ${Math.round(diffMin / 60)} h`;
}

export default function CompassModal() {
  const { suiviId, targetUserId, targetName } = useLocalSearchParams();
  const router = useRouter();

  const [permissionDenied, setPermissionDenied] = useState(false);
  const [myCoords, setMyCoords] = useState(null);
  const [heading, setHeading] = useState(0);
  const [target, setTarget] = useState(null);
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let sub;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermissionDenied(true);
        return;
      }
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 2 },
        (loc) => setMyCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
      );
    })();
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    Magnetometer.setUpdateInterval(200);
    const sub = Magnetometer.addListener(({ x, y }) => {
      let angle = toDeg(Math.atan2(y, x)) - 90;
      if (angle < 0) angle += 360;
      setHeading(angle);
    });
    return () => sub.remove();
  }, []);

  const refreshTarget = async () => {
    try {
      const positions = await listPositions(suiviId);
      const found = positions.find((p) => p.user_id === targetUserId);
      if (found && found.lat != null && found.lng != null) {
        setTarget(found);
      }
    } catch {
      // rattrapé au prochain tick socket
    }
  };

  useEffect(() => {
    refreshTarget();
  }, [suiviId, targetUserId]);

  useSuiviSocket(suiviId, refreshTarget);

  const bearing =
    myCoords && target ? bearingBetween(myCoords, { latitude: target.lat, longitude: target.lng }) : null;
  const distance =
    myCoords && target ? distanceBetween(myCoords, { latitude: target.lat, longitude: target.lng }) : null;

  useEffect(() => {
    if (bearing == null) return;
    const relative = (bearing - heading + 360) % 360;
    Animated.timing(rotation, {
      toValue: relative,
      duration: 150,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [bearing, heading]);

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={["bottom", "left", "right"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: targetName || "Retrouver",
          headerStyle: { backgroundColor: colors.slate900 },
          headerTintColor: "white",
          headerRight: () => <HeaderCloseButton onPress={() => router.back()} />,
        }}
      />

      {permissionDenied ? (
        <View className="flex-1 items-center justify-center px-6" style={{ gap: 12 }}>
          <MapPinOff size={28} color={colors.slate400} />
          <Text className="text-sm text-slate-300 text-center">
            Autorisez l'accès à votre position pour utiliser la boussole.
          </Text>
        </View>
      ) : !myCoords || !target ? (
        <View className="flex-1 items-center justify-center" style={{ gap: 12 }}>
          <ActivityIndicator color={colors.fuchsia500} />
          <Text className="text-sm text-slate-300">
            {!myCoords ? "Localisation en cours…" : `${targetName || "Cette personne"} ne partage pas sa position.`}
          </Text>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center" style={{ gap: 24 }}>
          <Animated.View
            style={{
              width: 220,
              height: 220,
              borderRadius: 110,
              borderWidth: 2,
              borderColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
              transform: [
                {
                  rotate: rotation.interpolate({
                    inputRange: [0, 360],
                    outputRange: ["0deg", "360deg"],
                  }),
                },
              ],
            }}
          >
            <Navigation size={64} color={colors.fuchsia500} fill={colors.fuchsia500} />
          </Animated.View>

          <View style={{ alignItems: "center", gap: 4 }}>
            <Text className="text-white text-2xl font-extrabold">{formatDistance(distance)}</Text>
            <Text className="text-slate-400 text-xs font-semibold">
              {targetName ? `vers ${targetName}` : "vers cette personne"} · position {formatAgo(target.geo_updated_at)}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
