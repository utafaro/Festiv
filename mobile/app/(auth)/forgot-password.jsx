import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, Mail } from "lucide-react-native";
import { forgotPassword } from "../../src/api/auth";
import { colors } from "../../src/theme/colors";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError("Erreur lors de l'envoi. Vérifiez votre adresse email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-base font-extrabold text-slate-800">Mot de passe oublié</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <X size={20} color={colors.slate400} />
        </Pressable>
      </View>

      <View className="px-6 pt-6">
        {sent ? (
          <View className="bg-white border border-slate-200 rounded-3xl p-6 items-center" style={{ gap: 10 }}>
            <Text className="text-sm font-bold text-slate-800 text-center">
              Email envoyé !
            </Text>
            <Text className="text-xs text-slate-500 text-center">
              Si un compte existe avec cette adresse, vous recevrez un lien de
              réinitialisation.
            </Text>
            <Pressable onPress={() => router.back()} className="bg-indigo-600 rounded-xl px-4 py-2.5 mt-2">
              <Text className="text-white text-xs font-bold">Retour à la connexion</Text>
            </Pressable>
          </View>
        ) : (
          <View className="bg-white border border-slate-200 rounded-3xl p-6" style={{ gap: 14 }}>
            <Text className="text-xs text-slate-500">
              Entrez votre adresse email, nous vous enverrons un lien pour
              réinitialiser votre mot de passe.
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
            {error ? <Text className="text-rose-600 text-xs font-semibold">{error}</Text> : null}
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              className="bg-indigo-600 rounded-xl py-3.5 items-center"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-sm font-bold">Envoyer le lien</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
