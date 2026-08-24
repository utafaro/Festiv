import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { UserPlus } from "lucide-react-native";
import { listFriends } from "../api/friend";
import { colors } from "../theme/colors";

export default function FriendPicker({
  excludeIds = [],
  onSelect,
  tintColor,
  placeholder = "Rechercher un ami...",
}) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    listFriends()
      .then(setFriends)
      .finally(() => setLoading(false));
  }, []);

  const excluded = new Set(excludeIds);
  const q = query.trim().toLowerCase();
  const matches = q
    ? friends.filter(
        (f) =>
          !excluded.has(f.user_id) &&
          (f.full_name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q)),
      )
    : [];

  return (
    <View style={{ gap: 8 }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={loading ? "Chargement..." : placeholder}
        placeholderTextColor={colors.slate400}
        editable={!loading}
        autoCapitalize="none"
        className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800"
      />
      {q.length > 0 && (
        <View className="border border-slate-200 rounded-xl overflow-hidden">
          {matches.length === 0 ? (
            <Text className="text-[11px] text-slate-400 px-3.5 py-2.5">
              {friends.length === 0 ? "Ajoutez d'abord des amis." : "Aucun ami correspondant."}
            </Text>
          ) : (
            matches.slice(0, 6).map((f) => (
              <Pressable
                key={f.id}
                onPress={() => {
                  onSelect(f);
                  setQuery("");
                }}
                className="flex-row items-center px-3.5 py-2.5 border-b border-slate-100"
                style={{ gap: 8 }}
              >
                <UserPlus size={13} color={tintColor || colors.indigo600} />
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-800" numberOfLines={1}>
                    {f.full_name}
                  </Text>
                  <Text className="text-[10px] text-slate-500" numberOfLines={1}>
                    {f.email}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </View>
      )}
    </View>
  );
}
