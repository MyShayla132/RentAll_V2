import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import axios from "axios";
import { decode as atob } from "base-64";
export default function OTPScreen() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selfie, setSelfie] = useState(null);
  const inputs = useRef([]);
  const route = useRoute();
  const navigation = useNavigation();

  const { email, firstName, lastName, birthday, phone, address, password, validId } =
    route.params || {};

  useEffect(() => {
    console.log("Received validId:", validId);
  }, []);

  const handleChange = (text, idx) => {
    if (/^\d*$/.test(text)) {
      const newOtp = [...otp];
      newOtp[idx] = text;
      setOtp(newOtp);

      if (text && idx < otp.length - 1) {
        inputs.current[idx + 1].focus();
      } else if (!text && idx > 0) {
        inputs.current[idx - 1].focus();
      }
    }
  };

  const handleResend = async () => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) Alert.alert("Error", error.message);
      else Alert.alert("Success", "OTP resent to " + email);
    } catch {
      Alert.alert("Error", "Failed to resend OTP");
    }
  };

  const pickSelfie = async () => {
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelfie(result.assets[0].base64);
      Alert.alert("Selfie Captured", "Ready to verify your face.");
    }
  };

  const compareFaces = async (idBase64, selfieBase64) => {
    const apiKey = "W9-sl3ggHVQ2DsAuGh8abK4GJe-6LWY7";
    const apiSecret = "IKs0rowIo3yVqLB8FS3kpOkpFhJ3qTt3";
    const url = "https://api-us.faceplusplus.com/facepp/v3/compare";

    const formData = new FormData();
    formData.append("api_key", apiKey);
    formData.append("api_secret", apiSecret);
    formData.append("image_base64_1", idBase64);
    formData.append("image_base64_2", selfieBase64);

    try {
      const response = await axios.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.confidence > 75;
    } catch (error) {
      console.error("Face++ Error:", error);
      return false;
    }
  };

  const uploadIdToSupabase = async (userId, idFile) => {
    try {
      if (!idFile?.uri) throw new Error("Missing validId URI for upload.");

      const fileName = `${userId}_valid_id_${Date.now()}.jpg`;

      // Read base64 string from file
      const base64 = await FileSystem.readAsStringAsync(idFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to binary
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from("valid-ids")
        .upload(fileName, bytes, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.error("Supabase Upload Error:", error.message);
        throw error;
      }

      const { data: urlData } = supabase.storage
        .from("valid-ids")
        .getPublicUrl(fileName);

      console.log("Uploaded ID URL:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Upload ID error:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    const code = otp.join("");

    if (code.length < 6) {
      Alert.alert("Invalid OTP", "Enter the complete 6-digit code.");
      return;
    }

    if (!selfie) {
      Alert.alert("Missing Selfie", "Please take a selfie before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: verifyData, error: verifyError } =
        await supabase.auth.verifyOtp({
          email,
          token: code,
          type: "email",
        });

      if (verifyError) {
        Alert.alert("Error", "Invalid or expired OTP.");
        return;
      }

      const userId = verifyData?.user?.id;
      if (!userId) {
        Alert.alert("Error", "User ID not found.");
        return;
      }

      const idBase64 = await FileSystem.readAsStringAsync(validId?.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const faceMatched = await compareFaces(idBase64, selfie);
      if (!faceMatched) {
        Alert.alert("Face Mismatch", "Your face doesn't match your ID.");
        return;
      }

      let idFileUrl = null;
      if (validId) {
        try {
          idFileUrl = await uploadIdToSupabase(userId, validId);
        } catch (err) {
          Alert.alert("Upload Failed", "ID not uploaded, but account created.");
        }
      }

      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("user_id")
        .eq("user_id", userId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        Alert.alert("Error", "Could not check user.");
        return;
      }

      if (!existingUser) {
        const { error: insertError } = await supabase.from("users").insert([
          {
            user_id: userId,
            email,
            first_name: firstName,
            last_name: lastName,
            birthday,
            phone,
            address,
            password_hash: password,
            valid_id_url: idFileUrl,
            created_at: new Date().toISOString(),
            verified: true,
          },
        ]);
        if (insertError) {
          Alert.alert("Error", "Failed to create user profile.");
          return;
        }
      }

      // ✅ Update Supabase Auth user metadata with valid ID URL
      if (idFileUrl) {
        const { error: metaError } = await supabase.auth.updateUser({
          data: {
            valid_id_url: idFileUrl,
          },
        });

        if (metaError) {
          console.warn("Metadata update failed:", metaError.message);
        }
      }

      Alert.alert("Success", "Registration complete!");
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    } catch (error) {
      console.error("OTP Submission Error:", error);
      Alert.alert("Error", "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topCurve} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "center" }}
      >
        <View style={styles.iconContainer}>
          <Image
            source={require("../assets/mail.png")}
            style={styles.icon}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.infoText}>
          Enter the OTP sent to your email and verify your identity.
        </Text>

        <View style={styles.otpRow}>
          {otp.map((value, i) => (
            <TextInput
              key={i}
              ref={(ref) => (inputs.current[i] = ref)}
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              value={value}
              onChangeText={(text) => handleChange(text, i)}
              textAlign="center"
              editable={!isSubmitting}
            />
          ))}
        </View>

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't receive OTP? </Text>
          <TouchableOpacity onPress={handleResend} disabled={isSubmitting}>
            <Text
              style={[styles.resendLink, isSubmitting && styles.disabledText]}
            >
              RESEND
            </Text>
          </TouchableOpacity>
        </View>

        {selfie && (
          <Image
            source={{ uri: `data:image/jpeg;base64,${selfie}` }}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              alignSelf: "center",
              marginBottom: 10,
            }}
          />
        )}

        <TouchableOpacity
          onPress={pickSelfie}
          style={styles.submitButton}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>Take Selfie</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Verifying..." : "Submit"}
          </Text>
        </TouchableOpacity>

        {isSubmitting && <ActivityIndicator size="large" color="#FF9900" />}
      </KeyboardAvoidingView>
      <View style={styles.bottomCurve} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF5E9", alignItems: "center" },
  topCurve: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#1a1208",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 1,
  },
  bottomCurve: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: "#1a1208",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    zIndex: 1,
  },
  iconContainer: { alignItems: "center", marginBottom: 24 },
  icon: { width: 80, height: 80, tintColor: "#1a1208" },
  infoText: {
    textAlign: "center",
    color: "#222",
    fontSize: 15,
    marginBottom: 28,
    marginHorizontal: 18,
  },
  otpRow: { flexDirection: "row", justifyContent: "center", marginBottom: 18 },
  otpInput: {
    width: 48,
    height: 48,
    borderWidth: 2,
    borderColor: "#ccc",
    borderRadius: 10,
    backgroundColor: "#fff",
    fontSize: 22,
    marginHorizontal: 4,
    color: "#222",
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
  },
  resendText: { color: "#222", fontSize: 13 },
  resendLink: { color: "#FF9900", fontWeight: "bold", fontSize: 13 },
  disabledText: { color: "#ccc" },
  submitButton: {
    backgroundColor: "#000",
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 60,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonDisabled: { backgroundColor: "#666" },
  submitButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
