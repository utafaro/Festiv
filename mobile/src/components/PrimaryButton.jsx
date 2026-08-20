import { Pressable, Text, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../theme/colors";

// Fallback Android/web : @expo/ui/swift-ui n'existe que sur iOS (résolu via
// PrimaryButton.ios.jsx sur cette plateforme, jamais importé ici).
export default function PrimaryButton({ label, onPress, loading, disabled, tintColor, className = "" }) {
  const isDisabled = disabled || loading;

  return (
    <Pressable onPress={onPress} disabled={isDisabled} className={className}>
      <LinearGradient
        colors={[tintColor || colors.indigo600, colors.purple600]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 16,
          paddingVertical: 14,
          alignItems: "center",
          opacity: isDisabled ? 0.6 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-extrabold text-xs uppercase tracking-wide">{label}</Text>
        )}
      </LinearGradient>
    </Pressable>
  );
}
