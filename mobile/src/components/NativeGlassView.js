import { GlassView as RawGlassView } from "expo-glass-effect";
import { cssInterop } from "nativewind";

// GlassView vient de requireNativeViewManager (native view manager brut) :
// NativeWind ne le patche pas automatiquement comme les composants RN core
// (View, Text...), donc `className` ne fait rien dessus sans cet enregistrement
// explicite — sans lui, bg/border/padding/flex-row passés en className sont
// silencieusement ignorés (carte invisible, top bar sans layout, cropping).
cssInterop(RawGlassView, { className: "style" });

export default RawGlassView;
