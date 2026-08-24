import { Button } from "@expo/ui/swift-ui";
import { buttonStyle, tint as tintMod, controlSize, labelStyle } from "@expo/ui/swift-ui/modifiers";
import Host from "../NativeHost";
import { colors } from "../../theme/colors";

// Boutons de barre de navigation natifs (SwiftUI Button hébergé via Host) :
// à placer dans les options headerLeft/headerRight de Stack.Screen pour que
// même le contenu des boutons soit du natif, pas juste la barre qui les entoure.

export function HeaderIconButton({ systemImage, accessibilityLabel, onPress, tint }) {
  return (
    <Host matchContents>
      <Button
        systemImage={systemImage}
        label={accessibilityLabel}
        onPress={onPress}
        modifiers={[
          buttonStyle("glass"),
          controlSize("regular"),
          labelStyle("iconOnly"),
          tintMod(tint || colors.indigo600),
        ]}
      />
    </Host>
  );
}

export function HeaderTextButton({ label, systemImage, onPress, tint, prominent = false }) {
  return (
    <Host matchContents>
      <Button
        label={label}
        systemImage={systemImage}
        onPress={onPress}
        modifiers={[
          buttonStyle(prominent ? "glassProminent" : "glass"),
          controlSize("regular"),
          tintMod(tint || colors.indigo600),
        ]}
      />
    </Host>
  );
}

export function HeaderCloseButton({ onPress }) {
  return (
    <Host matchContents>
      <Button
        systemImage="xmark"
        label="Fermer"
        onPress={onPress}
        modifiers={[buttonStyle("plain"), labelStyle("iconOnly"), tintMod(colors.slate400)]}
      />
    </Host>
  );
}

export function HeaderAvatarButton({ initials, onPress }) {
  return (
    <Host matchContents>
      <Button
        label={initials || "?"}
        onPress={onPress}
        modifiers={[buttonStyle("bordered"), controlSize("small"), tintMod(colors.indigo600)]}
      />
    </Host>
  );
}
