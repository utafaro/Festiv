import { useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Navigation, MapPinOff } from "lucide-react-native";
import { listPositions } from "../../src/api/suivi";
import { useSuiviSocket } from "../../src/hooks/useSuiviSocket";
import { colors } from "../../src/theme/colors";
import { HeaderCloseButton } from "../../src/components/nav/HeaderButtons";

function formatAgo(iso) {
  if (!iso) return "";
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  return `il y a ${Math.round(diffMin / 60)} h`;
}

export default function FollowMapModal() {
  const { suiviId, targetUserId, targetName } = useLocalSearchParams();
  const router = useRouter();
  const mapRef = useRef(null);

  const [permissionDenied, setPermissionDenied] = useState(false);
  const [myCoords, setMyCoords] = useState(null);
  const [heading, setHeading] = useState(0);
  const [target, setTarget] = useState(null);

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
    let sub;
    (async () => {
      sub = await Location.watchHeadingAsync(({ trueHeading, magHeading }) => {
        const h = trueHeading >= 0 ? trueHeading : magHeading;
        setHeading(h);
      });
    })();
    return () => sub?.remove();
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

  useEffect(() => {
    if (!myCoords || !target || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      [myCoords, { latitude: target.lat, longitude: target.lng }],
      { edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }, animated: true },
    );
  }, [myCoords, target]);

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
            Autorisez l'accès à votre position pour utiliser la carte.
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
        <View style={{ flex: 1 }}>
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: (myCoords.latitude + target.lat) / 2,
              longitude: (myCoords.longitude + target.lng) / 2,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            <Marker coordinate={myCoords} anchor={{ x: 0.5, y: 0.5 }} flat rotation={heading}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: "rgba(79,70,229,0.18)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Navigation size={18} color={colors.indigo600} fill={colors.indigo600} />
              </View>
            </Marker>
            <Marker coordinate={{ latitude: target.lat, longitude: target.lng }} pinColor={colors.fuchsia600} />
          </MapView>

          <View className="absolute left-4 right-4 bottom-4 bg-slate-900/90 rounded-2xl px-4 py-3">
            <Text className="text-white text-sm font-bold">{targetName || "Cette personne"}</Text>
            <Text className="text-slate-400 text-xs font-semibold mt-0.5">
              position {formatAgo(target.geo_updated_at)}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
