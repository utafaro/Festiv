import { useCallback, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, TextInput, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  UserPlus,
  Trash2,
  Check,
  X,
  LogOut,
  Crown,
  Radar,
  Navigation,
  Users,
  MapPin,
  Compass,
} from "lucide-react-native";
import ToastStack from "../../../src/components/ToastStack";
import { useToasts } from "../../../src/hooks/useToasts";
import { useAuth } from "../../../src/context/AuthContext";
import { useSuiviSocket } from "../../../src/hooks/useSuiviSocket";
import {
  getSuivi,
  listSuiviMembers,
  inviteSuiviMember,
  listSuiviInvitations,
  acceptSuiviInvitation,
  deleteSuiviInvitation,
  listSuiviSets,
  listPositions,
  clearPosition,
  clearGeo,
} from "../../../src/api/suivi";
import { getFestivalById } from "../../../src/api/festival";
import { colors } from "../../../src/theme/colors";
import GlassCard from "../../../src/components/GlassCard";

function formatGeoAgo(iso) {
  if (!iso) return "";
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  return `il y a ${Math.round(diffMin / 60)} h`;
}

export default function SuiviDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [toasts, triggerToast] = useToasts();

  const [suivi, setSuivi] = useState(null);
  const [festival, setFestival] = useState(null);
  const [members, setMembers] = useState([]);
  const [sets, setSets] = useState([]);
  const [positions, setPositions] = useState([]);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [clearingPosition, setClearingPosition] = useState(false);
  const [clearingGeo, setClearingGeo] = useState(false);

  const isOwner = suivi && user && suivi.owner_id === user.id;

  const load = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      const suiviData = await getSuivi(id);
      setSuivi(suiviData);
      const festivalData = await getFestivalById(suiviData.festival_id);
      setFestival(festivalData);

      if (suiviData.owner_id === user.id) {
        setPendingInvite(null);
        const [membersData, setsData, positionsData] = await Promise.all([
          listSuiviMembers(id),
          listSuiviSets(id),
          listPositions(id),
        ]);
        setMembers(membersData);
        setSets(setsData);
        setPositions(positionsData);
      } else {
        const invitations = await listSuiviInvitations();
        const mine = invitations.find((inv) => inv.suivi_id === id);
        if (mine) {
          setPendingInvite(mine);
        } else {
          setPendingInvite(null);
          const [membersData, setsData, positionsData] = await Promise.all([
            listSuiviMembers(id),
            listSuiviSets(id),
            listPositions(id),
          ]);
          setMembers(membersData);
          setSets(setsData);
          setPositions(positionsData);
        }
      }
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        setNotFound(true);
      } else {
        triggerToast("Impossible de charger ce suivi.", "error");
      }
    } finally {
      setLoading(false);
    }
  }, [id, user, triggerToast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const refreshLive = useCallback(async () => {
    try {
      const positionsData = await listPositions(id);
      setPositions(positionsData);
    } catch {
      // rattrapé par la prochaine mise à jour socket ou le prochain focus
    }
  }, [id]);

  useSuiviSocket(suivi && !pendingInvite ? id : null, refreshLive);

  const handleAccept = async () => {
    setResponding(true);
    try {
      await acceptSuiviInvitation(pendingInvite.id);
      triggerToast("Invitation acceptée !", "success");
      load();
    } catch {
      triggerToast("Erreur lors de l'acceptation.", "error");
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    setResponding(true);
    try {
      await deleteSuiviInvitation(pendingInvite.id);
      router.replace("/(tabs)/suivi");
    } catch {
      triggerToast("Erreur lors du refus.", "error");
      setResponding(false);
    }
  };

  const handleLeave = () => {
    const myMembership = members.find((m) => m.user_id === user.id);
    if (!myMembership) return;
    Alert.alert("Quitter ce suivi ?", "", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Quitter",
        style: "destructive",
        onPress: async () => {
          await deleteSuiviInvitation(myMembership.id);
          router.replace("/(tabs)/suivi");
        },
      },
    ]);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const member = await inviteSuiviMember(id, inviteEmail.trim());
      setMembers((prev) => [...prev, member]);
      setInviteEmail("");
      triggerToast(`Invitation envoyée à ${member.email}.`, "success");
    } catch (err) {
      triggerToast(err.response?.data?.detail || "Erreur lors de l'invitation.", "error");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = (memberId) => {
    Alert.alert("Retirer cette personne ?", "", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Retirer",
        style: "destructive",
        onPress: async () => {
          await deleteSuiviInvitation(memberId);
          setMembers((prev) => prev.filter((m) => m.id !== memberId));
        },
      },
    ]);
  };

  const handleClearPosition = async () => {
    setClearingPosition(true);
    try {
      await clearPosition(id);
      setPositions((prev) =>
        prev
          .map((p) =>
            p.user_id === user.id
              ? { ...p, target_type: null, set_id: null, custom_label: null, note: null, grouped_with: [] }
              : p,
          )
          .filter((p) => p.user_id !== user.id || p.lat != null),
      );
      triggerToast("Position retirée.", "info");
    } catch {
      triggerToast("Erreur lors de la suppression de votre position.", "error");
    } finally {
      setClearingPosition(false);
    }
  };

  const handleClearGeo = async () => {
    setClearingGeo(true);
    try {
      await clearGeo(id);
      setPositions((prev) =>
        prev
          .map((p) => (p.user_id === user.id ? { ...p, lat: null, lng: null, geo_updated_at: null } : p))
          .filter((p) => p.user_id !== user.id || p.target_type),
      );
      triggerToast("Partage de position GPS arrêté.", "info");
    } catch {
      triggerToast("Erreur lors de l'arrêt du partage.", "error");
    } finally {
      setClearingGeo(false);
    }
  };

  const openPositionForm = (quickTarget) => {
    if (quickTarget) {
      router.push({
        pathname: "/modals/position-form",
        params: {
          suiviId: id,
          targetType: quickTarget.target_type,
          setId: quickTarget.set_id || "",
          customLabel: quickTarget.custom_label || "",
          groupedWith: JSON.stringify(quickTarget.grouped_with || []),
        },
      });
    } else {
      router.push({ pathname: "/modals/position-form", params: { suiviId: id } });
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color={colors.fuchsia600} />
      </SafeAreaView>
    );
  }

  if (notFound || !suivi) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center px-6">
        <Text className="text-slate-700 font-semibold text-base text-center">
          Ce suivi est introuvable ou vous n'y avez pas accès.
        </Text>
        <Pressable onPress={() => router.back()} className="bg-indigo-600 rounded-xl px-4 py-2.5 mt-4">
          <Text className="text-white text-sm font-semibold">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const myPosition = positions.find((p) => p.user_id === user.id && p.target_type);
  const myGeo = positions.find((p) => p.user_id === user.id && p.lat != null);
  const geoPeople = positions.filter((p) => p.lat != null);
  const setById = Object.fromEntries(sets.map((s) => [s.id, s]));
  const nameByUserId = Object.fromEntries(positions.map((p) => [p.user_id, p.full_name]));

  const groups = positions
    .filter((p) => p.target_type)
    .reduce((acc, p) => {
      const key =
        p.target_type === "set"
          ? `set:${p.set_id}`
          : `custom:${(p.custom_label || "").trim().toLowerCase()}`;
      (acc[key] ||= []).push(p);
      return acc;
    }, {});

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={[]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Retour",
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100, gap: 16 }}>
        <GlassCard className="p-5">
          <View className="flex-row mb-2" style={{ gap: 6 }}>
            <View className="flex-row items-center bg-fuchsia-50 rounded-lg px-2 py-1" style={{ gap: 4 }}>
              <Radar size={11} color={colors.fuchsia600} />
              <Text className="text-[9px] font-bold text-fuchsia-600 uppercase">Suivi live</Text>
            </View>
            {isOwner ? (
              <View className="flex-row items-center bg-amber-50 rounded-lg px-2 py-1" style={{ gap: 4 }}>
                <Crown size={11} color={colors.amber700} />
                <Text className="text-[9px] font-bold text-amber-700 uppercase">Propriétaire</Text>
              </View>
            ) : (
              <View className="bg-slate-100 rounded-lg px-2 py-1">
                <Text className="text-[9px] font-bold text-slate-600 uppercase">Partagé avec vous</Text>
              </View>
            )}
          </View>
          <Text className="text-xl font-extrabold text-slate-900">
            {suivi.name || festival?.name || "Notre Suivi"}
          </Text>
          {festival && (
            <Text className="text-xs text-slate-500 mt-1">
              {festival.name} — {festival.location}
            </Text>
          )}
        </GlassCard>

        {pendingInvite ? (
          <GlassCard className="p-6 items-center" style={{ gap: 14 }}>
            <Text className="text-sm font-semibold text-slate-700">
              Vous avez été invité à rejoindre ce suivi live.
            </Text>
            <View className="flex-row" style={{ gap: 10 }}>
              <Pressable
                onPress={handleAccept}
                disabled={responding}
                className="bg-emerald-600 rounded-xl px-4 py-2.5 flex-row items-center"
                style={{ gap: 6 }}
              >
                <Check size={15} color="white" />
                <Text className="text-white text-xs font-bold">Accepter</Text>
              </Pressable>
              <Pressable
                onPress={handleDecline}
                disabled={responding}
                className="bg-slate-100 rounded-xl px-4 py-2.5 flex-row items-center"
                style={{ gap: 6 }}
              >
                <X size={15} color={colors.slate600} />
                <Text className="text-slate-600 text-xs font-bold">Refuser</Text>
              </Pressable>
            </View>
          </GlassCard>
        ) : (
          <>
            <GlassCard className="p-5">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <Navigation size={16} color={colors.fuchsia600} />
                  <Text className="text-base font-bold text-slate-900">Scènes actives</Text>
                </View>
                {myPosition ? (
                  <Pressable onPress={handleClearPosition} disabled={clearingPosition}>
                    <Text className="text-[11px] font-bold text-rose-600">Je ne suis plus là</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => openPositionForm(null)}
                    className="flex-row items-center bg-fuchsia-600 rounded-xl px-3 py-2"
                    style={{ gap: 6 }}
                  >
                    <MapPin size={13} color="white" />
                    <Text className="text-white text-[11px] font-bold">Ma position</Text>
                  </Pressable>
                )}
              </View>

              {Object.keys(groups).length === 0 ? (
                <Text className="text-xs text-slate-400 text-center py-6">
                  Personne ne pointe sa position pour l'instant.
                </Text>
              ) : (
                Object.entries(groups).map(([key, people]) => {
                  const isCustom = key.startsWith("custom:");
                  const target = isCustom ? null : setById[people[0].set_id];
                  const title = isCustom
                    ? people[0].custom_label || "Lieu personnalisé"
                    : target?.name || target?.artists?.map((a) => a.name).join(" B2B ") || "Set";
                  const targetId = isCustom ? people[0].custom_label : people[0].set_id;
                  const iAmHere = people.some((p) => p.user_id === user.id);

                  return (
                    <Pressable
                      key={key}
                      onPress={() =>
                        openPositionForm({
                          target_type: isCustom ? "custom" : "set",
                          set_id: isCustom ? null : targetId,
                          custom_label: isCustom ? targetId : null,
                          grouped_with: people.filter((p) => p.user_id !== user.id).map((p) => p.user_id),
                        })
                      }
                      className="rounded-2xl p-4 mb-3 border"
                      style={{
                        backgroundColor: isCustom ? "#fdf4ff" : colors.slate100,
                        borderColor: isCustom ? "#f5d0fe" : colors.slate200,
                      }}
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-sm font-semibold text-slate-900 flex-1" numberOfLines={1}>
                          {title}
                        </Text>
                        {isCustom ? (
                          <View className="bg-fuchsia-100 rounded px-2 py-0.5">
                            <Text className="text-[9px] font-bold text-fuchsia-700 uppercase">
                              Lieu perso
                            </Text>
                          </View>
                        ) : (
                          target &&
                          (target.stage || target.start_time) && (
                            <Text className="text-[10px] font-medium text-slate-600 bg-slate-200 rounded px-2 py-0.5">
                              {[target.stage?.name, target.start_time?.slice(11, 16)]
                                .filter(Boolean)
                                .join(" • ")}
                            </Text>
                          )
                        )}
                      </View>
                      {people.map((p) => (
                        <View key={p.user_id} className="flex-row items-start mb-1.5" style={{ gap: 8 }}>
                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: "#e0e7ff",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text className="text-[9px] font-bold text-indigo-600">
                              {p.full_name?.[0]?.toUpperCase() || "?"}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="text-xs font-semibold text-slate-800">
                              {p.full_name}
                              {p.grouped_with?.length > 0 && (
                                <Text className="text-slate-400 font-normal">
                                  {" "}
                                  avec {p.grouped_with.map((uid) => nameByUserId[uid] || "quelqu'un").join(", ")}
                                </Text>
                              )}
                            </Text>
                            {p.note && <Text className="text-[11px] text-slate-500">{p.note}</Text>}
                          </View>
                        </View>
                      ))}
                      <Text className="text-[9px] font-bold uppercase text-fuchsia-600/80 mt-1">
                        {iAmHere ? "Modifier ma position ici" : "Toucher pour me placer ici"}
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </GlassCard>

            <GlassCard className="p-5" style={{ gap: 12 }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <MapPin size={16} color={colors.fuchsia600} />
                  <Text className="text-sm font-bold text-slate-900">Localisation live</Text>
                </View>
                {myGeo ? (
                  <Pressable onPress={handleClearGeo} disabled={clearingGeo}>
                    <Text className="text-[11px] font-bold text-rose-600">Arrêter le partage</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => router.push({ pathname: "/modals/geo-ping", params: { suiviId: id } })}
                    className="flex-row items-center bg-fuchsia-600 rounded-xl px-3 py-2"
                    style={{ gap: 6 }}
                  >
                    <MapPin size={13} color="white" />
                    <Text className="text-white text-[11px] font-bold">Partager ma position</Text>
                  </Pressable>
                )}
              </View>

              {geoPeople.length === 0 ? (
                <Text className="text-xs text-slate-400 text-center py-4">
                  Personne ne partage sa position GPS pour l'instant.
                </Text>
              ) : (
                geoPeople.map((p) => (
                  <View
                    key={p.user_id}
                    className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-3.5"
                  >
                    <View className="flex-row items-center flex-1 pr-2" style={{ gap: 10 }}>
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: "#fdf4ff",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text className="text-[9px] font-bold text-fuchsia-600">
                          {p.full_name?.[0]?.toUpperCase() || "?"}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-xs font-semibold text-slate-800" numberOfLines={1}>
                          {p.user_id === user.id ? "Vous" : p.full_name}
                        </Text>
                        <Text className="text-[10px] text-slate-500">{formatGeoAgo(p.geo_updated_at)}</Text>
                      </View>
                    </View>
                    {p.user_id !== user.id && (
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: "/modals/compass",
                            params: { suiviId: id, targetUserId: p.user_id, targetName: p.full_name },
                          })
                        }
                        className="flex-row items-center bg-indigo-600 rounded-lg px-2.5 py-1.5"
                        style={{ gap: 4 }}
                      >
                        <Compass size={13} color="white" />
                        <Text className="text-white text-[10px] font-bold">Boussole</Text>
                      </Pressable>
                    )}
                  </View>
                ))
              )}
            </GlassCard>

            <GlassCard className="p-5" style={{ gap: 12 }}>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <UserPlus size={16} color={colors.fuchsia600} />
                <Text className="text-sm font-bold text-slate-900">Membres</Text>
              </View>

              {isOwner && (
                <View className="flex-row" style={{ gap: 8 }}>
                  <TextInput
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    placeholder="email@exemple.com"
                    placeholderTextColor={colors.slate400}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800"
                  />
                  <Pressable
                    onPress={handleInvite}
                    disabled={inviting}
                    className="bg-fuchsia-600 rounded-xl px-3.5 items-center justify-center"
                  >
                    {inviting ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white text-xs font-bold">Inviter</Text>
                    )}
                  </Pressable>
                </View>
              )}

              {members.length === 0 ? (
                <Text className="text-xs text-slate-400">Aucun membre invité pour l'instant.</Text>
              ) : (
                members.map((m) => (
                  <View key={m.id} className="flex-row items-center justify-between bg-slate-50 rounded-xl p-2.5">
                    <View className="flex-1 pr-2">
                      <Text className="text-xs font-semibold text-slate-800" numberOfLines={1}>
                        {m.full_name}
                      </Text>
                      <Text className="text-[10px] text-slate-500" numberOfLines={1}>
                        {m.email}
                      </Text>
                    </View>
                    <View className="flex-row items-center" style={{ gap: 8 }}>
                      <View
                        className="rounded px-2 py-0.5"
                        style={{ backgroundColor: m.status === "accepted" ? colors.emerald50 : colors.amber50 }}
                      >
                        <Text
                          className="text-[9px] font-bold uppercase"
                          style={{ color: m.status === "accepted" ? colors.emerald700 : colors.amber700 }}
                        >
                          {m.status === "accepted" ? "Accepté" : "En attente"}
                        </Text>
                      </View>
                      {isOwner && (
                        <Pressable onPress={() => handleRemoveMember(m.id)}>
                          <Trash2 size={14} color={colors.rose600} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))
              )}

              {!isOwner && (
                <Pressable
                  onPress={handleLeave}
                  className="flex-row items-center justify-center bg-slate-100 rounded-xl py-2.5"
                  style={{ gap: 6 }}
                >
                  <LogOut size={13} color={colors.slate600} />
                  <Text className="text-xs font-bold text-slate-600">Quitter le suivi</Text>
                </Pressable>
              )}
            </GlassCard>

            <GlassCard className="p-5" style={{ gap: 10 }}>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Users size={15} color={colors.indigo600} />
                <Text className="text-sm font-bold text-slate-900">En ce moment ({positions.length})</Text>
              </View>
              {positions.length === 0 ? (
                <Text className="text-xs text-slate-400">Personne ne partage sa position.</Text>
              ) : (
                positions.map((p) => (
                  <View key={p.user_id} className="flex-row items-center" style={{ gap: 8 }}>
                    <View
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: "#e0e7ff",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text className="text-[9px] font-bold text-indigo-600">
                        {p.full_name?.[0]?.toUpperCase() || "?"}
                      </Text>
                    </View>
                    <Text className="text-xs font-semibold text-slate-700">{p.full_name}</Text>
                  </View>
                ))
              )}
            </GlassCard>
          </>
        )}
      </ScrollView>

      <ToastStack toasts={toasts} />
    </SafeAreaView>
  );
}
