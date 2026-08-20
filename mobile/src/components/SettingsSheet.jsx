import { useWindowDimensions } from "react-native";
import { Host, BottomSheet, Group, Form, Section, Button, Text } from "@expo/ui/swift-ui";
import {
  foregroundStyle,
  presentationDetents,
  presentationDragIndicator,
  presentationBackground,
} from "@expo/ui/swift-ui/modifiers";
import { useAuth } from "../context/AuthContext";
import { useSettingsSheet } from "../context/SettingsSheetContext";
import { colors } from "../theme/colors";

// Sheet 100% natif : BottomSheet + Form/Section/Button SwiftUI, aucune vue RN
// à l'intérieur. `fitToContents` mesure mal un Form/List (conçu pour remplir
// l'espace dispo, pas s'ajuster à son contenu) — ça laissait un grand espace
// transparent sous la section. Un detent fixe + un presentationBackground
// opaque évitent les deux : plus de zone floue, plus de trou visuel.
// Les modifiers de présentation (detents, background...) doivent être posés
// sur le CONTENU (via Group), pas sur BottomSheet lui-même — comme en SwiftUI
// natif, `.sheet { Content().presentationDetents(...) }` s'applique au contenu.
export default function SettingsSheet() {
  const { width } = useWindowDimensions();
  const { user, logout } = useAuth();
  const { open, hide } = useSettingsSheet();

  const handleLogout = async () => {
    hide();
    await logout();
  };

  return (
    <Host style={{ position: "absolute", width }} pointerEvents="none">
      <BottomSheet isPresented={open} onIsPresentedChange={(presented) => !presented && hide()}>
        <Group
          modifiers={[
            presentationDetents([{ fraction: 0.3 }]),
            presentationDragIndicator("visible"),
            presentationBackground(colors.slate50),
          ]}
        >
          <Form>
            <Section title="Compte" footer={user?.email ? <Text>{user.email}</Text> : undefined}>
              <Button
                role="destructive"
                systemImage="rectangle.portrait.and.arrow.right"
                label="Déconnexion"
                onPress={handleLogout}
                modifiers={[foregroundStyle(colors.rose600)]}
              />
            </Section>
          </Form>
        </Group>
      </BottomSheet>
    </Host>
  );
}
