import { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useFocusEffect } from "expo-router";
import { UserPlus, Check, X, Trash2, Users } from "lucide-react-native";
import ToastStack from "../../../src/components/ToastStack";
import { HeaderAvatarButton } from "../../../src/components/nav/HeaderButtons";
import { useToasts } from "../../../src/hooks/useToasts";
import { useAuth } from "../../../src/context/AuthContext";
import { useSettingsSheet } from "../../../src/context/SettingsSheetContext";
import { getInitials } from "../../../src/utils/getInitials";
import { listFriends, listFriendInvitations, addFriend, acceptFriend, deleteFriend } from "../../../src/api/friend";
import { colors } from "../../../src/theme/colors";
import GlassCard from "../../../src/components/GlassCard";

export default function AmisScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { show: showSettings } = useSettingsSheet();
  const [friends, setFriends] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [toasts, triggerToast] = useToasts();

  const load = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const [friendsData, invitesData] = await Promise.all([listFriends(), listFriendInvitations()]);
      setFriends(friendsData);
      setInvitations(invitesData);
    } catch {
      triggerToast("Impossible de charger vos amis.", "error");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [triggerToast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleAdd = async () => {
    const value = email.trim();
    if (!value) return;
    setAdding(true);
    try {
      await addFriend(value);
      setEmail("");
      triggerToast("Demande d'ami envoyée.", "success");
      load();
    } catch (err) {
      triggerToast(err.response?.data?.detail || "Erreur lors de l'envoi de la demande.", "error");
    } finally {
      setAdding(false);
    }
  };

  const handleAccept = async (invite) => {
    setRespondingId(invite.id);
    try {
      await acceptFriend(invite.id);
      triggerToast(`${invite.full_name} est maintenant votre ami.`, "success");
      load();
    } catch {
      triggerToast("Erreur lors de l'acceptation.", "error");
    } finally {
      setRespondingId(null);
    }
  };

  const handleDecline = async (invite) => {
    setRespondingId(invite.id);
    try {
      await deleteFriend(invite.id);
      setInvitations((prev) => prev.filter((i) => i.id !== invite.id));
      triggerToast("Demande refusée.", "info");
    } catch {
      triggerToast("Erreur lors du refus.", "error");
    } finally {
      setRespondingId(null);
    }
  };

  const handleRemoveFriend = (friend) => {
    Alert.alert(
      "Retirer cet ami ?",
      "Il sera aussi retiré de vos lineups et suivis partagés.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: async () => {
            setRemovingId(friend.id);
            try {
              await deleteFriend(friend.id);
              setFriends((prev) => prev.filter((f) => f.id !== friend.id));
              triggerToast("Ami retiré.", "info");
            } catch {
              triggerToast("Erreur lors de la suppression.", "error");
            } finally {
              setRemovingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={[]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "FESTIV",
          headerRight: () => (
            <HeaderAvatarButton initials={getInitials(user?.full_name)} onPress={showSettings} />
          ),
        }}
      />

      <View className="px-4 pt-5 pb-2">
        <Text className="text-xl font-extrabold text-slate-900">Amis</Text>
        <Text className="text-xs text-slate-500 mt-1">
          Ajoutez des amis pour les inviter dans vos lineups et suivis.
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.indigo600} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100, gap: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(true);
              }}
            />
          }
        >
          <GlassCard className="p-5" style={{ gap: 10 }}>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <UserPlus size={16} color={colors.indigo600} />
              <Text className="text-sm font-bold text-slate-900">Ajouter un ami</Text>
            </View>
            <View className="flex-row" style={{ gap: 8 }}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email@exemple.com"
                placeholderTextColor={colors.slate400}
                autoCapitalize="none"
                keyboardType="email-address"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800"
              />
              <Pressable
                onPress={handleAdd}
                disabled={adding}
                className="bg-indigo-600 rounded-xl px-3.5 items-center justify-center"
              >
                {adding ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white text-xs font-bold">Ajouter</Text>
                )}
              </Pressable>
            </View>
          </GlassCard>

          {invitations.length > 0 && (
            <GlassCard className="p-5" style={{ gap: 12 }}>
              <Text className="text-[10px] font-bold text-slate-400 uppercase">
                Demandes reçues
              </Text>
              {invitations.map((inv) => (
                <View
                  key={inv.id}
                  className="flex-row items-center justify-between bg-slate-50 rounded-xl p-2.5"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-semibold text-slate-800" numberOfLines={1}>
                      {inv.full_name}
                    </Text>
                    <Text className="text-[10px] text-slate-500" numberOfLines={1}>
                      {inv.email}
                    </Text>
                  </View>
                  <View className="flex-row" style={{ gap: 8 }}>
                    <Pressable
                      onPress={() => handleAccept(inv)}
                      disabled={respondingId === inv.id}
                      className="bg-emerald-600 rounded-lg p-2"
                    >
                      <Check size={14} color="white" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleDecline(inv)}
                      disabled={respondingId === inv.id}
                      className="bg-slate-200 rounded-lg p-2"
                    >
                      <X size={14} color={colors.slate600} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </GlassCard>
          )}

          <GlassCard className="p-5" style={{ gap: 12 }}>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Users size={16} color={colors.indigo600} />
              <Text className="text-sm font-bold text-slate-900">Mes amis ({friends.length})</Text>
            </View>
            {friends.length === 0 ? (
              <Text className="text-xs text-slate-400 text-center py-4">
                Aucun ami pour l'instant. Ajoutez-en un via son email.
              </Text>
            ) : (
              friends.map((f) => (
                <View
                  key={f.id}
                  className="flex-row items-center justify-between bg-slate-50 rounded-xl p-2.5"
                >
                  <View className="flex-1 pr-2">
                    <Text className="text-xs font-semibold text-slate-800" numberOfLines={1}>
                      {f.full_name}
                    </Text>
                    <Text className="text-[10px] text-slate-500" numberOfLines={1}>
                      {f.email}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleRemoveFriend(f)} disabled={removingId === f.id}>
                    {removingId === f.id ? (
                      <ActivityIndicator size="small" color={colors.rose600} />
                    ) : (
                      <Trash2 size={15} color={colors.rose600} />
                    )}
                  </Pressable>
                </View>
              ))
            )}
          </GlassCard>
        </ScrollView>
      )}

      <ToastStack toasts={toasts} />
    </SafeAreaView>
  );
}
