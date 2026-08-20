import { NativeTabs } from "expo-router/unstable-native-tabs";
import { SettingsSheetProvider } from "../../src/context/SettingsSheetContext";
import SettingsSheet from "../../src/components/SettingsSheet";

export default function TabsLayout() {
  return (
    <SettingsSheetProvider>
      <NativeTabs>
        <NativeTabs.Trigger name="dashboard">
          <NativeTabs.Trigger.Label>Mon Tableau</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="calendar" md="event" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="lineups">
          <NativeTabs.Trigger.Label>Lineup</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="bolt.fill" md="bolt" />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="suivi">
          <NativeTabs.Trigger.Label>Amis & Live</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf="person.2.fill" md="group" />
        </NativeTabs.Trigger>
      </NativeTabs>
      <SettingsSheet />
    </SettingsSheetProvider>
  );
}
