import { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import {
  Plus,
  Pencil,
  Trash2,
  Share2,
  UserPlus,
  Crown,
  LogOut,
  Check,
  X,
} from "lucide-react-native";
import ToastStack from "../../src/components/ToastStack";
import { useToasts } from "../../src/hooks/useToasts";
import { useAuth } from "../../src/context/AuthContext";
import {
  getLineup,
  listMembers,
  inviteMember,
  listInvitations,
  acceptInvitation,
  deleteInvitation,
  listStages,
  listSets,
  deleteSet,
} from "../../src/api/lineup";
import { getFestivalById } from "../../src/api/festival";
import { colors } from "../../src/theme/colors";
import GlassCard from "../../src/components/GlassCard";

export default function LineupDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [toasts, triggerToast] = useToasts();

  const [lineup, setLineup] = useState(null);
  const [festival, setFestival] = useState(null);
  const [members, setMembers] = useState([]);
  const [stages, setStages] = useState([]);
  const [sets, setSets] = useState([]);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [responding, setResponding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const isOwner = lineup && user && lineup.owner_id === user.id;

  const load = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
      const lineupData = await getLineup(id);
      setLineup(lineupData);
      const festivalData = await getFestivalById(lineupData.festival_id);
      setFestival(festivalData);

      if (lineupData.owner_id === user.id) {
        setPendingInvite(null);
        const [membersData, stagesData, setsData] = await Promise.all([
          listMembers(id),
          listStages(id),
          listSets(id),
        ]);
        setMembers(membersData);
        setStages(stagesData);
        setSets(setsData);
      } else {
        const invitations = await listInvitations();
        const mine = invitations.find((inv) => inv.lineup_id === id);
        if (mine) {
          setPendingInvite(mine);
        } else {
          setPendingInvite(null);
          const [membersData, stagesData, setsData] = await Promise.all([
            listMembers(id),
            listStages(id),
            listSets(id),
          ]);
          setMembers(membersData);
          setStages(stagesData);
          setSets(setsData);
        }
      }
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        setNotFound(true);
      } else {
        triggerToast("Impossible de charger cette lineup.", "error");
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

  const handleAccept = async () => {
    setResponding(true);
    try {
      await acceptInvitation(pendingInvite.id);
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
      await deleteInvitation(pendingInvite.id);
      router.replace("/(tabs)/lineups");
    } catch {
      triggerToast("Erreur lors du refus.", "error");
      setResponding(false);
    }
  };

  const handleLeave = () => {
    const myMembership = members.find((m) => m.user_id === user.id);
    if (!myMembership) return;
    Alert.alert("Quitter cette lineup ?", "", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Quitter",
        style: "destructive",
        onPress: async () => {
          await deleteInvitation(myMembership.id);
          router.replace("/(tabs)/lineups");
        },
      },
    ]);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const member = await inviteMember(id, inviteEmail.trim());
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
          await deleteInvitation(memberId);
          setMembers((prev) => prev.filter((m) => m.id !== memberId));
        },
      },
    ]);
  };

  const handleDeleteSet = (setId) => {
    Alert.alert("Supprimer ce set du line-up ?", "", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setDeletingId(setId);
          try {
            await deleteSet(id, setId);
            setSets((prev) => prev.filter((s) => s.id !== setId));
            triggerToast("Set supprimé.", "success");
          } catch {
            triggerToast("Erreur lors de la suppression.", "error");
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color={colors.indigo600} />
      </SafeAreaView>
    );
  }

  if (notFound || !lineup) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center px-6">
        <Text className="text-slate-700 font-semibold text-base text-center">
          Cette lineup est introuvable ou vous n'y avez pas accès.
        </Text>
        <Pressable onPress={() => router.back()} className="bg-indigo-600 rounded-xl px-4 py-2.5 mt-4">
          <Text className="text-white text-sm font-semibold">Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const groups = sets.reduce((acc, s) => {
    const key = s.date.slice(0, 10);
    (acc[key] ||= []).push(s);
    return acc;
  }, {});
  const orderedDates = Object.keys(groups).sort();

  const formatDay = (d) =>
    new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={[]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "",
          headerBackTitle: "Retour",
        }}
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <GlassCard className="p-5">
          <View className="flex-row mb-2" style={{ gap: 6 }}>
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
            {lineup.name || festival?.name || "Ma Lineup"}
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
              Vous avez été invité à consulter cette lineup.
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
                <Text className="text-base font-bold text-slate-900">Line-up & Programmation</Text>
                <View className="flex-row" style={{ gap: 8 }}>
                  <Pressable
                    onPress={() =>
                      Share.share({ message: `Découvre notre lineup Festiv : ${festival?.name || ""}` })
                    }
                    className="bg-slate-100 rounded-lg p-2"
                  >
                    <Share2 size={14} color={colors.slate600} />
                  </Pressable>
                  {isOwner && (
                    <Pressable
                      onPress={() => router.push(`/modals/set-form?lineupId=${id}`)}
                      className="bg-indigo-600 rounded-lg px-3 py-2 flex-row items-center"
                      style={{ gap: 4 }}
                    >
                      <Plus size={13} color="white" />
                      <Text className="text-white text-[11px] font-bold">Ajouter</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {orderedDates.length === 0 ? (
                <Text className="text-xs text-slate-400 text-center py-6">
                  Aucun set programmé pour l'instant.
                </Text>
              ) : (
                orderedDates.map((dateKey) => (
                  <View key={dateKey} className="mb-4">
                    <Text className="text-[10px] font-bold text-slate-400 uppercase mb-2 capitalize">
                      {formatDay(dateKey)}
                    </Text>
                    {groups[dateKey].map((s) => (
                      <View
                        key={s.id}
                        className="flex-row items-center justify-between bg-slate-50 rounded-2xl p-3.5 mb-2"
                      >
                        <View className="flex-1 pr-2">
                          <Text className="text-sm font-semibold text-slate-900" numberOfLines={1}>
                            {s.name || s.artists.map((a) => a.name).join(" B2B ") || "Set"}
                          </Text>
                          <View className="flex-row items-center mt-1" style={{ gap: 6 }}>
                            <Text className="text-[10px] font-medium bg-slate-200 text-slate-700 rounded px-1.5 py-0.5">
                              {s.stage.name}
                            </Text>
                            <Text className="text-[11px] text-slate-500">
                              {s.start_time.slice(11, 16)} - {s.end_time.slice(11, 16)}
                            </Text>
                          </View>
                        </View>
                        {isOwner && (
                          <View className="flex-row" style={{ gap: 4 }}>
                            <Pressable
                              onPress={() =>
                                router.push(`/modals/set-form?lineupId=${id}&setId=${s.id}`)
                              }
                              className="p-2"
                            >
                              <Pencil size={15} color={colors.indigo600} />
                            </Pressable>
                            <Pressable
                              onPress={() => handleDeleteSet(s.id)}
                              disabled={deletingId === s.id}
                              className="p-2"
                            >
                              {deletingId === s.id ? (
                                <ActivityIndicator size="small" color={colors.rose600} />
                              ) : (
                                <Trash2 size={15} color={colors.rose600} />
                              )}
                            </Pressable>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                ))
              )}
            </GlassCard>

            <GlassCard className="p-5" style={{ gap: 12 }}>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <UserPlus size={16} color={colors.indigo600} />
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
                    className="bg-indigo-600 rounded-xl px-3.5 items-center justify-center"
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
                  <View
                    key={m.id}
                    className="flex-row items-center justify-between bg-slate-50 rounded-xl p-2.5"
                  >
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
                        style={{
                          backgroundColor: m.status === "accepted" ? colors.emerald50 : colors.amber50,
                        }}
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
                  <Text className="text-xs font-bold text-slate-600">Quitter la lineup</Text>
                </Pressable>
              )}
            </GlassCard>
          </>
        )}
      </ScrollView>

      <ToastStack toasts={toasts} />
    </SafeAreaView>
  );
}
