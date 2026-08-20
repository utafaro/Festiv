import { Host as RawHost } from "@expo/ui/swift-ui";
import { cssInterop } from "nativewind";

// Même souci que GlassView (cf. NativeGlassView.js) : Host vient de
// requireNativeView, NativeWind ne le patche pas — className (ex: "w-full")
// est silencieusement ignoré sans cet enregistrement explicite.
cssInterop(RawHost, { className: "style" });

export default RawHost;
