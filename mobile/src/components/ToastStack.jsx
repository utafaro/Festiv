import { View, Text } from "react-native";
import { Zap } from "lucide-react-native";
import { colors } from "../theme/colors";
import GlassCard from "./GlassCard";

const STYLES = {
  success: { bg: colors.emerald50, fg: colors.emerald700 },
  warning: { bg: colors.rose50, fg: colors.rose600 },
  error: { bg: colors.rose50, fg: colors.rose600 },
  info: { bg: "#eef2ff", fg: colors.indigo600 },
};

export default function ToastStack({ toasts }) {
  if (!toasts.length) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: "absolute", bottom: 24, left: 16, right: 16, gap: 8 }}
    >
      {toasts.map((toast) => {
        const style = STYLES[toast.type] || STYLES.info;
        return (
          <GlassCard
            key={toast.id}
            radius="rounded-2xl"
            className="flex-row items-center px-4 py-3"
            style={{ gap: 10 }}
          >
            <View
              style={{
                backgroundColor: style.bg,
                padding: 8,
                borderRadius: 12,
              }}
            >
              <Zap size={16} color={style.fg} />
            </View>
            <Text className="flex-1 text-xs font-semibold text-slate-700">
              {toast.message}
            </Text>
          </GlassCard>
        );
      })}
    </View>
  );
}
