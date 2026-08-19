import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Radio, Mail, Lock, User } from "lucide-react-native";
import { useAuth } from "../../src/context/AuthContext";
import { colors } from "../../src/theme/colors";

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

            <View className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <View className="flex-row bg-slate-100 rounded-xl p-1 mb-6">
                <Pressable
                  onPress={() => setMode("login")}
                  className={`flex-1 py-2.5 rounded-lg items-center ${
                    mode === "login" ? "bg-white shadow-sm" : ""
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      mode === "login" ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    Connexion
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setMode("signup")}
                  className={`flex-1 py-2.5 rounded-lg items-center ${
                    mode === "signup" ? "bg-white shadow-sm" : ""
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      mode === "signup" ? "text-slate-900" : "text-slate-500"
                    }`}
                  >
                    Créer un compte
                  </Text>
                </Pressable>
              </View>

              {mode === "signup" && (
                <View className="mb-4">
                  <Text className="text-xs font-bold text-slate-500 mb-1.5">
                    Nom complet
                  </Text>
                  <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5">
                    <User size={16} color={colors.slate400} />
                    <TextInput
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Arthur Pendragon"
                      placeholderTextColor={colors.slate400}
                      autoCapitalize="words"
                      className="flex-1 py-3.5 px-2.5 text-sm text-slate-900"
                    />
                  </View>
                </View>
              )}

              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-500 mb-1.5">
                  Adresse email
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5">
                  <Mail size={16} color={colors.slate400} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="vous@exemple.com"
                    placeholderTextColor={colors.slate400}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    className="flex-1 py-3.5 px-2.5 text-sm text-slate-900"
                  />
                </View>
              </View>

              <View className="mb-2">
                <Text className="text-xs font-bold text-slate-500 mb-1.5">
                  Mot de passe
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5">
                  <Lock size={16} color={colors.slate400} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••••"
                    placeholderTextColor={colors.slate400}
                    secureTextEntry
                    className="flex-1 py-3.5 px-2.5 text-sm text-slate-900"
                  />
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

              <Pressable onPress={handleSubmit} disabled={loading} className="mt-5">
                <LinearGradient
                  colors={[colors.indigo600, colors.purple600]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 14,
                    alignItems: "center",
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold text-sm">
                      {mode === "login" ? "Se connecter" : "Commencer l'aventure"}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
