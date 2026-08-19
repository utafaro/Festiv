import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Radio, LogOut } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

function getInitials(fullName) {
  if (!fullName) return "??";
  return fullName
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function BackHeader({ title, onBack, right }) {
  const router = useRouter();
  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
      <Pressable
        onPress={onBack || (() => router.back())}
        className="flex-row items-center"
        style={{ gap: 6 }}
      >
        <ArrowLeft size={18} color={colors.slate600} />
        <Text className="text-sm font-semibold text-slate-600" numberOfLines={1}>
          {title}
        </Text>
      </Pressable>
      {right}
    </View>
  );
}

export default function ScreenHeader() {
  const { user, logout } = useAuth();

  return (
    <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
      <View className="flex-row items-center" style={{ gap: 8 }}>
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: colors.indigo600,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Radio color="white" size={16} />
        </View>
        <Text className="text-lg font-extrabold text-slate-900">
          FESTIV<Text className="text-indigo-600">.</Text>
        </Text>
      </View>

      <View className="flex-row items-center" style={{ gap: 10 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: colors.indigo600,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text className="text-white text-[11px] font-extrabold">
            {getInitials(user?.full_name)}
          </Text>
        </View>
        <Pressable onPress={logout} hitSlop={8}>
          <LogOut size={18} color={colors.slate400} />
        </Pressable>
      </View>
    </View>
  );
}
