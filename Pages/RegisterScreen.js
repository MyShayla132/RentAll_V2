import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import CryptoJS from "crypto-js";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthday: "",
    phone: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [validId, setValidId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const validateForm = () => {
    const {
      firstName,
      lastName,
      birthday,
      phone,
      email,
      address,
      password,
      confirmPassword,
    } = form;
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !birthday.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !address.trim() ||
      !password.trim() ||
      !confirmPassword.trim()
    ) {
      Alert.alert("Error", "All fields are required");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }
    if (!validId) {
      Alert.alert("Error", "Please upload a valid ID");
      return false;
    }
    return true;
  };

  const uploadValidId = async (validId, email) => {
    try {
      const fileExt = validId.name.split(".").pop();
      const filePath = `valid-ids/${email.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}.${fileExt}`;
      const fileData = await FileSystem.readAsStringAsync(validId.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const contentType = validId.type || "image/jpeg";

      const { error } = await supabase.storage
        .from("valid-ids")
        .upload(filePath, Buffer.from(fileData, "base64"), {
          contentType,
          upsert: true,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("valid-ids")
        .getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Upload ID error:", error);
      throw error;
    }
  };

  const handleNext = async () => {
    if (!validateForm()) return;

    setUploading(true);
    try {
      const { email, password } = form;
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      const hashedPassword = CryptoJS.SHA256(form.password).toString();

      // ✅ Don't upload valid ID yet, just pass it to OTP screen
      navigation.navigate("Otp", {
        ...form,
        password: hashedPassword,
        validId,
      });
    } catch (error) {
      Alert.alert("Error", error.message || "Registration failed");
    } finally {
      setUploading(false);
    }
  };

  const pickDocument = async () => {
    Alert.alert(
      "Select ID Document",
      "Choose how you want to upload your valid ID",
      [
        { text: "Camera", onPress: pickFromCamera },
        { text: "Gallery", onPress: pickFromGallery },
        { text: "Files", onPress: pickFromFiles },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("Permission denied", "Camera access needed.");

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setValidId({
        uri: result.assets[0].uri,
        name: `id_${Date.now()}.jpg`,
        type: "image/jpeg",
      });
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted")
      return Alert.alert("Permission denied", "Gallery access needed.");

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setValidId({
        uri: result.assets[0].uri,
        name: `id_${Date.now()}.jpg`,
        type: "image/jpeg",
      });
    }
  };

  const pickFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });
      if (!result.canceled) {
        setValidId({
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          type: result.assets[0].mimeType,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const handleChange = (key, value) => setForm({ ...form, [key]: value });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF5E9" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.header}>Registration</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { marginRight: 5 }]}
              placeholder="First Name"
              value={form.firstName}
              onChangeText={(text) => handleChange("firstName", text)}
            />
            <TextInput
              style={[styles.input, { marginLeft: 5 }]}
              placeholder="Last Name"
              value={form.lastName}
              onChangeText={(text) => handleChange("lastName", text)}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { marginRight: 5 }]}
              placeholder="MM/DD/YYYY"
              value={form.birthday}
              onChangeText={(text) => handleChange("birthday", text)}
            />
            <TextInput
              style={[styles.input, { marginLeft: 5 }]}
              placeholder="+63"
              value={form.phone}
              keyboardType="phone-pad"
              onChangeText={(text) => handleChange("phone", text)}
            />
          </View>
          <TextInput
            style={[styles.input, styles.singleLineInput]}
            placeholder="Email"
            value={form.email}
            keyboardType="email-address"
            onChangeText={(text) => handleChange("email", text)}
          />
           <TextInput
            style={[styles.input, styles.singleLineInput]}
            placeholder="Address"
            value={form.address}
            keyboardType="address"
            onChangeText={(text) => handleChange("address", text)}
          />
          <TextInput
            style={[styles.input, styles.singleLineInput]}
            placeholder="Password"
            value={form.password}
            secureTextEntry
            onChangeText={(text) => handleChange("password", text)}
          />
          <TextInput
            style={[styles.input, styles.singleLineInput]}
            placeholder="Confirm Password"
            value={form.confirmPassword}
            secureTextEntry
            onChangeText={(text) => handleChange("confirmPassword", text)}
          />
          <TouchableOpacity style={styles.uploadBox} onPress={pickDocument}>
            <View style={styles.uploadContent}>
              {validId ? (
                <>
                  <Image
                    source={{ uri: validId.uri }}
                    style={styles.uploadedImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.uploadedText}>{validId.name}</Text>
                  <Text style={styles.changeText}>Tap to change</Text>
                </>
              ) : (
                <>
                  <Text style={styles.uploadIcon}>📁</Text>
                  <Text style={styles.uploadText}>Upload Valid ID</Text>
                  <Text style={styles.uploadSubText}>
                    Tap to select from camera, gallery, or files
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.terms}>
            By clicking next, you agree to our{" "}
            <Text style={{ color: "#FF9900" }}>Terms and Conditions</Text>
          </Text>
          <TouchableOpacity
            style={[styles.button, uploading && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={uploading}
          >
            <Text style={styles.buttonText}>
              {uploading ? "Sending OTP..." : "Next"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.footer}>
            Already have an account?{" "}
            <Text
              style={{ color: "#FF9900" }}
              onPress={() => navigation.navigate("Login")}
            >
              Login
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF5E9",
    padding: 20,
    paddingTop: 80,
    flexGrow: 1,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 30,
  },
  row: {
    flexDirection: "row",
  },
  input: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 6,
    flex: 1,
  },
  singleLineInput: {
    height: 28,
    fontSize: 13,
    paddingVertical: 0,
  },
  uploadBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginVertical: 8,
    minHeight: 120,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  uploadContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  uploadSubText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  uploadedImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  uploadedText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
    marginBottom: 4,
  },
  changeText: {
    fontSize: 12,
    color: "#FF9900",
  },
  terms: {
    fontSize: 12,
    textAlign: "center",
    marginVertical: 12,
  },
  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#666",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  footer: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 12,
  },
});
