import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";

export default function EditProfile() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    current_password: "",
    birthday: "",
    phone: "",
    profile_pic: null,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission denied",
            "We need media library permissions to upload profile pictures."
          );
        }
      }

      const {
        data: { user },
        error: userSessionError,
      } = await supabase.auth.getUser();

      if (userSessionError) {
        Alert.alert("Error", "Failed to get user session.");
        return;
      }

      if (user) {
        const { data: userData, error: profileError } = await supabase
          .from("users")
          .select("first_name, last_name, email, birthday, phone, profile_pic")
          .eq("user_id", user.id)
          .single();

        if (userData) {
          setForm((prev) => ({
            ...prev,
            ...userData,
            email: user.email,
          }));
        } else if (profileError) {
          Alert.alert("Error loading profile", profileError.message);
        }
      }
    })();
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        quality: 1,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];
        const fileType = asset.mimeType || "image/jpeg";
        const fileName = asset.fileName || `profile_${Date.now()}.jpeg`;

        const file = {
          uri: asset.uri,
          name: fileName,
          type: fileType,
        };

        setForm((prev) => ({ ...prev, profile_pic: file }));
      }
    } catch (err) {
      Alert.alert("Error picking image", err.message || "Image picker failed.");
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    let imageUrl = null;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Error", "Failed to fetch user.");
        setLoading(false);
        return;
      }

      if (form.current_password) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: form.current_password,
        });

        if (authError) {
          Alert.alert("Authentication Failed", "Incorrect current password.");
          setLoading(false);
          return;
        }
      }

      if (form.profile_pic?.uri && !form.profile_pic.uri.startsWith("http")) {
        try {
          const response = await fetch(form.profile_pic.uri);
          const blob = await response.blob();

          const filePath = `avatars/${user.id}/${Date.now()}_${
            form.profile_pic.name
          }`;

          const { data: imageData, error: imageErr } = await supabase.storage
            .from("profile-pics")
            .upload(filePath, blob, {
              cacheControl: "3600",
              upsert: true,
              contentType: form.profile_pic.type,
            });

          if (imageErr || !imageData?.path) {
            Alert.alert(
              "Image Upload Failed",
              imageErr?.message || "Upload failed."
            );
            setLoading(false);
            return;
          }

          const { data: publicUrlData } = supabase.storage
            .from("profile-pics")
            .getPublicUrl(imageData.path);

          imageUrl = publicUrlData?.publicUrl;
        } catch (uploadErr) {
          Alert.alert("Image Upload Error", uploadErr.message);
          setLoading(false);
          return;
        }
      } else if (
        form.profile_pic?.uri &&
        form.profile_pic.uri.startsWith("http")
      ) {
        imageUrl = form.profile_pic.uri;
      }

      const updates = {};
      if (form.first_name !== undefined) updates.first_name = form.first_name;
      if (form.last_name !== undefined) updates.last_name = form.last_name;
      if (form.phone !== undefined) updates.phone = form.phone;
      if (form.birthday !== undefined) updates.birthday = form.birthday;
      if (imageUrl !== null) updates.profile_pic = imageUrl;

      if (Object.keys(updates).length > 0) {
        const { error: updateProfileError } = await supabase
          .from("users")
          .update(updates)
          .eq("user_id", user.id);

        if (updateProfileError) {
          Alert.alert("Profile Update Failed", updateProfileError.message);
          setLoading(false);
          return;
        }
      }

      const authUpdates = {};
      if (form.email && form.email !== user.email) {
        authUpdates.email = form.email;
      }
      if (form.password) {
        if (form.password !== form.confirm_password) {
          Alert.alert("Error", "Passwords do not match.");
          setLoading(false);
          return;
        }
        authUpdates.password = form.password;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authUpdateError } = await supabase.auth.updateUser(
          authUpdates
        );

        if (authUpdateError) {
          Alert.alert("Authentication Update Failed", authUpdateError.message);
          setLoading(false);
          return;
        }
      }

      Alert.alert("Success", "Profile updated successfully!");
    } catch (generalError) {
      Alert.alert("Error", generalError.message || "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF5E9" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Edit Profile</Text>

          <TouchableOpacity onPress={handlePickImage} disabled={loading}>
            {form.profile_pic ? (
              <Image
                source={{
                  uri:
                    typeof form.profile_pic === "string"
                      ? form.profile_pic
                      : form.profile_pic.uri,
                }}
                style={styles.image}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text>Select Profile Picture</Text>
              </View>
            )}
          </TouchableOpacity>

          {[
            "first_name",
            "last_name",
            "email",
            "birthday",
            "phone",
            "current_password",
            "password",
            "confirm_password",
          ].map((field) => (
            <TextInput
              key={field}
              style={styles.input}
              placeholder={field.replace("_", " ").toUpperCase()}
              secureTextEntry={field.includes("password")}
              value={form[field] || ""}
              onChangeText={(text) => setForm({ ...form, [field]: text })}
              editable={!loading}
            />
          ))}

          <TouchableOpacity
            style={styles.button}
            onPress={updateProfile}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Updating..." : "Update Profile"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#FFF5E9",
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#222",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
    color: "#333",
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: "#FF9900",
    padding: 15,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
});
