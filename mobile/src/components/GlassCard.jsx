import { View } from "react-native";
import GlassView from "./NativeGlassView";

// Carte "verre liquide" iOS 26 : rendu natif UIVisualEffectView sur iOS 26+,
// se replie automatiquement sur un fond translucide classique ailleurs
// (versions iOS antérieures, Android, web) — même composant partout.
//
// GlassView (via NativeGlassView, cf. cssInterop) accepte className comme
// n'importe quel View NativeWind. Le radius/clip reste géré par un View RN
// classique qui l'englobe : le cornerRadius natif d'un native view manager
// brut (requireNativeViewManager) n'est pas fiable pour clipper le flou —
// contrairement à un overflow-hidden sur un View standard. Padding/gap
// restent sur le GlassView interne pour que le flou s'étende jusqu'aux
// bords arrondis.
export default function GlassCard({ children, className = "", tintColor, style, radius = "rounded-3xl" }) {
  return (
    <View
      style={{
        shadowColor: "#0f172a",
        shadowOpacity: 0.1,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      }}
    >
      <View className={`${radius} overflow-hidden`}>
        <GlassView
          glassEffectStyle="regular"
          tintColor={tintColor}
          style={[{ flex: 1 }, style]}
          className={`bg-white/85 border border-slate-300/70 ${className}`}
        >
          {children}
        </GlassView>
      </View>
    </View>
  );
}
