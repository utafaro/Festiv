import { Tabs } from "expo-router";
import { Calendar, Zap, Users } from "lucide-react-native";
import { colors } from "../../src/theme/colors";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.indigo600,
        tabBarInactiveTintColor: colors.slate400,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
        tabBarStyle: { borderTopColor: colors.slate200 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Mon Tableau",
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="lineups"
        options={{
          title: "Lineup & Planning",
          tabBarIcon: ({ color, size }) => <Zap color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="suivi"
        options={{
          title: "Amis & Live",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
