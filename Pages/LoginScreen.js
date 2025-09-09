import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase"; // Make sure this is your Supabase client

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    // Only allow login for registered accounts
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert(
        "Login Failed",
        "Invalid email or password. Please try again."
      );
    } else if (data?.user) {
      // Navigate to Home or your main app screen
      navigation.navigate("Home");
    } else {
      Alert.alert("Login Failed", "Account not found. Please register first.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <Text style={styles.loginText}>Login</Text>
        <Image
          source={require("../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.logoText}>RentAll</Text>
      </View>

      <View style={styles.bottomContainer}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="juan@gmail.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="**********"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.forgotText}>
          Forgot{" "}
          <Text
            style={styles.highlight}
            onPress={() => navigation.navigate("Recover")}
          >
            password
          </Text>
          ?
        </Text>

        <Text style={styles.signupText}>
          Don’t have an account?{" "}
          <Text
            style={styles.signUpLink}
            onPress={() => navigation.navigate("Register")}
          >
            Sign up
          </Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2b1b0f", // dark brown background
  },
  topContainer: {
    backgroundColor: "#000",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  loginText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  logo: {
    width: 100,
    height: 100,
  },
  logoText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
  },
  bottomContainer: {
    backgroundColor: "#fff6ec",
    flex: 1,
    padding: 25,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -20,
  },
  label: {
    marginTop: 20,
    fontWeight: "bold",
    color: "#222",
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    marginTop: 5,
  },
  loginButton: {
    backgroundColor: "#000",
    padding: 15,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 30,
  },
  loginButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  forgotText: {
    marginTop: 15,
    textAlign: "center",
    color: "#333",
  },
  highlight: {
    color: "#facc15", // yellow
    fontWeight: "bold",
  },
  signupText: {
    textAlign: "center",
    marginTop: 5,
    color: "#333",
  },
  signUpLink: {
    color: "#f97316", // orange
    fontWeight: "bold",
  },
});
