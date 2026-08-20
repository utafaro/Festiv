import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Picker, TextField, SecureField, Text as UIText } from "@expo/ui/swift-ui";
import {
  pickerStyle,
  tag,
  keyboardType,
  textContentType,
  textInputAutocapitalization,
  autocorrectionDisabled,
  submitLabel,
  padding,
  font,
} from "@expo/ui/swift-ui/modifiers";
import { Radio, Mail, Lock, User } from "lucide-react-native";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";
import PrimaryButton from "../../src/components/PrimaryButton";
import GlassCard from "../../src/components/GlassCard";
import Host from "../../src/components/NativeHost";

export default function SignInScreen() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email || !password || (mode === "signup" && !fullName)) {
      setError("Merci de remplir tous les champs.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, fullName);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-6 py-10">
            <View className="items-center mb-8">
              <LinearGradient
                colors={[colors.indigo600, colors.purple600, colors.pink500]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Radio color="white" size={26} />
              </LinearGradient>
              <Text className="text-3xl font-extrabold text-slate-900">
                FESTIV<Text className="text-indigo-600">.</Text>
              </Text>
            </View>

            <GlassCard className="p-6">
              <Host matchContents={{ vertical: true }} className="w-full mb-6">
                <Picker
                  selection={mode}
                  onSelectionChange={setMode}
                  modifiers={[pickerStyle("segmented")]}
                >
                  <UIText modifiers={[tag("login")]}>Connexion</UIText>
                  <UIText modifiers={[tag("signup")]}>Créer un compte</UIText>
                </Picker>
              </Host>

              {mode === "signup" && (
                <View className="mb-4">
                  <Text className="text-xs font-bold text-slate-500 mb-1.5">
                    Nom complet
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5" style={{ gap: 10 }}>
                    <User size={16} color={colors.slate400} />
                    <Host matchContents={{ vertical: true }} className="flex-1">
                      <TextField
                        placeholder="Arthur Pendragon"
                        onTextChange={setFullName}
                        modifiers={[
                          font({ size: 16 }),
                          padding({ vertical: 12 }),
                          textInputAutocapitalization("words"),
                          textContentType("name"),
                        ]}
                      />
                    </Host>
                  </View>
                </View>
              )}

              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-500 mb-1.5">
                  Adresse email
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5" style={{ gap: 10 }}>
                  <Mail size={16} color={colors.slate400} />
                  <Host matchContents={{ vertical: true }} className="flex-1">
                    <TextField
                      placeholder="vous@exemple.com"
                      onTextChange={setEmail}
                      modifiers={[
                        font({ size: 16 }),
                        padding({ vertical: 12 }),
                        keyboardType("email-address"),
                        textInputAutocapitalization("never"),
                        autocorrectionDisabled(),
                        textContentType("emailAddress"),
                        submitLabel("next"),
                      ]}
                    />
                  </Host>
                </View>
              </View>

              <View className="mb-2">
                <Text className="text-xs font-bold text-slate-500 mb-1.5">
                  Mot de passe
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5" style={{ gap: 10 }}>
                  <Lock size={16} color={colors.slate400} />
                  <Host matchContents={{ vertical: true }} className="flex-1">
                    <SecureField
                      placeholder="••••••••••"
                      onTextChange={setPassword}
                      modifiers={[
                        font({ size: 16 }),
                        padding({ vertical: 12 }),
                        textContentType(mode === "signup" ? "newPassword" : "password"),
                        submitLabel("go"),
                      ]}
                    />
                  </Host>
                </View>
              </View>

              {mode === "login" && (
                <Pressable onPress={() => router.push("/(auth)/forgot-password")} className="self-end mb-1">
                  <Text className="text-xs font-semibold text-indigo-600">
                    Mot de passe oublié ?
                  </Text>
                </Pressable>
              )}

              {error ? (
                <Text className="text-rose-600 text-xs font-semibold mt-2">
                  {error}
                </Text>
              ) : null}

              <PrimaryButton
                label={mode === "login" ? "Se connecter" : "Commencer l'aventure"}
                onPress={handleSubmit}
                loading={loading}
                className="mt-5"
              />
            </GlassCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
