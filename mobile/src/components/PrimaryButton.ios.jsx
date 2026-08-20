import { Button } from "@expo/ui/swift-ui";
import { buttonStyle, tint, controlSize, disabled as disabledMod } from "@expo/ui/swift-ui/modifiers";
import { colors } from "../theme/colors";
import Host from "./NativeHost";

// Bouton d'action principal : composant natif SwiftUI, style "glassProminent"
// (Liquid Glass, iOS 26+ — se replie sur le style bordered natif standard
// sur les versions antérieures, toujours 100% natif).
export default function PrimaryButton({ label, onPress, loading, disabled, tintColor, className = "" }) {
  const isDisabled = disabled || loading;

  return (
    <Host matchContents={{ vertical: true }} className={`w-full ${className}`}>
      <Button
        label={loading ? "Chargement..." : label}
        onPress={isDisabled ? undefined : onPress}
        modifiers={[
          buttonStyle("glassProminent"),
          controlSize("large"),
          tint(tintColor || colors.indigo600),
          disabledMod(isDisabled),
        ]}
      />
    </Host>
  );
}
