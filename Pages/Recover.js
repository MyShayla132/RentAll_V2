import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const navigation = useNavigation();

  const handleSendResetLink = () => {
    // TODO: Add Supabase or email-sending logic here
    console.log("Sending password reset link to:", email);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF5E9" }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.header}>Forgot Password</Text>
        <Text style={styles.subtext}>
          Enter your email address to receive a password reset link.
        </Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="yourname@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity style={styles.button} onPress={handleSendResetLink}>
          <Text style={styles.buttonText}>Send Reset Link</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Remember your password?{" "}
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("Login")}
          >
            Back to Login
          </Text>
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    flex: 1,
    justifyContent: "center",
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
    textAlign: "center",
  },
  subtext: {
    fontSize: 14,
    color: "#444",
    marginBottom: 30,
    textAlign: "center",
  },
  label: {
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 12,
  },
  link: {
    color: "#FF9900",
    fontWeight: "bold",
  },
});
