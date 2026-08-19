import { useCallback, useState } from "react";
import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Plus, Sparkles, MapPin, Crown, Users, Check, X } from "lucide-react-native";
import ScreenHeader from "../../src/components/ScreenHeader";
import ToastStack from "../../src/components/ToastStack";
import { useToasts } from "../../src/hooks/useToasts";
import { listFestivals } from "../../src/api/festival";
import {
  listMyLineups,
  listSharedLineups,
  listInvitations,
  acceptInvitation,
  deleteInvitation,
} from "../../src/api/lineup";
import { colors } from "../../src/theme/colors";

function LineupCard({ lineup, shared, festival, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white border border-slate-200 rounded-2xl p-4 mb-3 active:opacity-90"
    >
      <View className="flex-row items-center justify-between mb-2">
        <View
          className="flex-row items-center rounded-lg px-2 py-1"
          style={{ gap: 4, backgroundColor: shared ? colors.slate100 : colors.amber50 }}
        >
          {shared ? (
            <Users size={11} color={colors.slate600} />
          ) : (
            <Crown size={11} color={colors.amber700} />
          )}
          <Text
            className="text-[9px] font-bold uppercase"
            style={{ color: shared ? colors.slate600 : colors.amber700 }}
          >
            {shared ? "Partagé avec moi" : "Propriétaire"}
          </Text>
        </View>
      </View>
      <Text className="text-sm font-extrabold text-slate-800" numberOfLines={1}>
        {lineup.name || festival?.name || "Ma Lineup"}
      </Text>
      {festival && (
        <View className="flex-row items-center mt-1.5" style={{ gap: 4 }}>
          <MapPin size={11} color={colors.slate400} />
          <Text className="text-xs font-semibold text-slate-500" numberOfLines={1}>
            {festival.name} — {festival.location}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export default function LineupsScreen() {
  const router = useRouter();
  const [mine, setMine] = useState([]);
  const [shared, setShared] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [festivalsById, setFestivalsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [toasts, triggerToast] = useToasts();

  const load = useCallback(async () => {
    try {
      const [mineData, sharedData, invitesData, festivalsData] = await Promise.all([
        listMyLineups(),
        listSharedLineups(),
        listInvitations(),
        listFestivals(),
      ]);
      setMine(mineData);
      setShared(sharedData);
      setInvitations(invitesData);
      const map = {};
      (festivalsData || []).forEach((f) => {
        map[f.id] = f;
      });
      setFestivalsById(map);
    } catch {
      triggerToast("Impossible de charger vos lineups.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [triggerToast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleAccept = async (inv) => {
    setRespondingId(inv.id);
    try {
      await acceptInvitation(inv.id);
      triggerToast("Invitation acceptée !", "success");
      load();
    } catch {
      triggerToast("Erreur lors de l'acceptation.", "error");
    } finally {
      setRespondingId(null);
    }
  };

  const handleDecline = async (inv) => {
    setRespondingId(inv.id);
    try {
      await deleteInvitation(inv.id);
      setInvitations((prev) => prev.filter((i) => i.id !== inv.id));
      triggerToast("Invitation refusée.", "info");
    } catch {
      triggerToast("Erreur lors du refus.", "error");
    } finally {
      setRespondingId(null);
    }
  };

  const sections = [];
  if (invitations.length > 0) {
    sections.push({ type: "invitations", data: invitations });
  }
  sections.push({ type: "mine", data: mine });
  if (shared.length > 0) {
    sections.push({ type: "shared", data: shared });
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <ScreenHeader />

      <View className="px-4 pt-5 pb-2 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xl font-extrabold text-slate-900">Lineup & Planning</Text>
          <Text className="text-xs text-slate-500 mt-1">
            Créez et partagez votre programmation.
          </Text>
        </View>
        <Pressable
          onPress={() => router.push("/modals/create-lineup")}
          className="bg-indigo-600 rounded-xl px-3.5 py-2.5 flex-row items-center active:opacity-80"
          style={{ gap: 6 }}
        >
          <Plus size={16} color="white" />
          <Text className="text-white text-xs font-bold">Créer</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.indigo600} />
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.type}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
            />
          }
          renderItem={({ item }) => {
            if (item.type === "invitations") {
              return (
                <View className="mb-5">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Invitations en attente
                  </Text>
                  {item.data.map((inv) => {
                    const festival = festivalsById[inv.festival_id];
                    return (
                      <View
                        key={inv.id}
                        className="bg-white border border-amber-200 rounded-2xl p-3.5 mb-2"
                      >
                        <Text className="text-sm font-bold text-slate-800" numberOfLines={1}>
                          {inv.lineup_name || festival?.name || "Une lineup"}
                        </Text>
                        {festival && (
                          <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                            {festival.name} — {festival.location}
                          </Text>
                        )}
                        <View className="flex-row mt-3" style={{ gap: 8 }}>
                          <Pressable
                            onPress={() => handleAccept(inv)}
                            disabled={respondingId === inv.id}
                            className="flex-1 bg-emerald-600 rounded-lg py-2 flex-row items-center justify-center"
                            style={{ gap: 4 }}
                          >
                            <Check size={13} color="white" />
                            <Text className="text-white text-xs font-bold">Accepter</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDecline(inv)}
                            disabled={respondingId === inv.id}
                            className="flex-1 bg-slate-100 rounded-lg py-2 flex-row items-center justify-center"
                            style={{ gap: 4 }}
                          >
                            <X size={13} color={colors.slate600} />
                            <Text className="text-slate-600 text-xs font-bold">Refuser</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            }

            if (item.type === "mine") {
              return (
                <View className="mb-5">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Mes Lineups
                  </Text>
                  {item.data.length === 0 ? (
                    <View className="bg-white/60 border border-slate-200 rounded-2xl p-8 items-center">
                      <Sparkles color={colors.indigo600} size={22} />
                      <Text className="text-xs font-bold text-slate-800 mt-3 text-center">
                        Aucune lineup pour l'instant
                      </Text>
                      <Text className="text-[11px] text-slate-500 mt-1 text-center">
                        Choisissez un festival pour créer votre programmation.
                      </Text>
                    </View>
                  ) : (
                    item.data.map((l) => (
                      <LineupCard
                        key={l.id}
                        lineup={l}
                        shared={false}
                        festival={festivalsById[l.festival_id]}
                        onPress={() => router.push(`/lineups/${l.id}`)}
                      />
                    ))
                  )}
                </View>
              );
            }

            return (
              <View className="mb-5">
                <Text className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                  Partagé avec moi
                </Text>
                {item.data.map((l) => (
                  <LineupCard
                    key={l.id}
                    lineup={l}
                    shared={true}
                    festival={festivalsById[l.festival_id]}
                    onPress={() => router.push(`/lineups/${l.id}`)}
                  />
                ))}
              </View>
            );
          }}
        />
      )}

      <ToastStack toasts={toasts} />
    </SafeAreaView>
  );
}
