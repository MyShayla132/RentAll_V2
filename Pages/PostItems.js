import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import { decode as atob } from "base-64";
import { supabase } from "../lib/supabase";
import { useNavigation } from "@react-navigation/native";

export default function PostItemScreen() {
  const navigation = useNavigation();
  const [itemImage, setItemImage] = useState(null);
  const [name, setName] = useState("");
  const [paymentInterval, setPaymentInterval] = useState("Per Day");
  const [deposit, setDeposit] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [description, setDescription] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const getUser = async () => {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error("Error getting session or user not logged in.");
        return;
      }
      setUserId(sessionData.session.user.id);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("category_id, name");

      if (error) {
        console.error("Error fetching categories:", error.message);
      } else {
        setCategoryOptions(data);
        if (data.length > 0) {
          setCategory(data[0].name);
        }
      }
    };
    fetchCategories();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setItemImage(result.assets[0].uri);
    }
  };

  const getCategoryId = async (categoryName) => {
    const { data, error } = await supabase
      .from("categories")
      .select("category_id")
      .eq("name", categoryName.trim())
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching category:", error.message);
      return null;
    }

    if (!data) {
      console.warn("No category found for:", categoryName);
      return null;
    }

    return data.category_id;
  };

  const uploadImageToSupabase = async (uri, userId) => {
    try {
      const fileName = `item_${userId}_${Date.now()}.jpg`;

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { data, error } = await supabase.storage
        .from("item-images")
        .upload(fileName, bytes, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.error("Upload error:", error.message);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from("item-images")
        .getPublicUrl(fileName);

      return urlData?.publicUrl || null;
    } catch (error) {
      console.error("Image upload failed:", error);
      return null;
    }
  };

  const handlePost = async () => {
    if (loading) return; // Prevent multiple clicks
    setLoading(true);

    if (!userId) {
      Alert.alert("Please log in first.");
      setLoading(false);
      return;
    }

    const quantityNum = parseInt(available, 10);
    if (isNaN(quantityNum) || quantityNum < 1) {
      Alert.alert("Please enter a valid quantity (1 or more).");
      setLoading(false);
      return;
    }

    const category_id = await getCategoryId(category);
    if (!category_id) {
      Alert.alert("Failed to get category ID.");
      setLoading(false);
      return;
    }

    let imageUrl = null;
    if (itemImage) {
      imageUrl = await uploadImageToSupabase(itemImage, userId);
      if (!imageUrl) {
        Alert.alert("Image upload failed.");
        setLoading(false);
        return;
      }
    }

    const payload = {
      user_id: userId,
      category_id,
      title: name,
      description,
      price_per_day: parseFloat(price),
      deposit_fee: parseFloat(deposit),
      location: location,
      quantity: quantityNum,
      available: quantityNum > 0,
      is_verified: false,
      created_at: new Date().toISOString(),
      image_url: imageUrl || null,
      payment_interval: paymentInterval,
    };

    const { data, error } = await supabase.from("items").insert([payload]);

    setLoading(false);

    if (error) {
      Alert.alert("Error posting item:", error.message);
    } else {
      Alert.alert("Item posted! Waiting for admin verification.");
      setName("");
      setDeposit("");
      setPrice("");
      setDescription("");
      setItemImage(null);
      setAvailable("");
      setLocation("");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top bar with back arrow */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Post Item</Text>
      </View>
      
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            {itemImage ? (
              <Image source={{ uri: itemImage }} style={styles.itemImage} />
            ) : (
              <View style={{ alignItems: "center" }}>
                <Ionicons name="cloud-upload-outline" size={32} color="orange" />
                <Text style={styles.imagePickerText}>
                  Upload{"\n"}Item{"\n"}Image
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            placeholder="Name of Item"
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={20} color="#000" />
            <Text style={styles.locationText}>
              Cagayan de Oro, Philippines - 9000
            </Text>
          </View>
          <TextInput
            placeholder="Location"
            style={styles.input}
            value={location}
            onChangeText={setLocation}
          />

          <View style={styles.dropdown}>
            <Picker
              selectedValue={paymentInterval}
              onValueChange={setPaymentInterval}
            >
              <Picker.Item label="Per Day" value="Per Day" />
              <Picker.Item label="Per Week" value="Per Week" />
              <Picker.Item label="Per Month" value="Per Month" />
            </Picker>
          </View>

          <TextInput
            placeholder="Set Initial Deposit Amount"
            style={styles.input}
            keyboardType="numeric"
            value={deposit}
            onChangeText={setDeposit}
          />

          <TextInput
            placeholder="Price"
            style={styles.input}
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <TextInput
            placeholder="How many items available?"
            style={styles.input}
            keyboardType="numeric"
            value={available}
            onChangeText={setAvailable}
          />

          <View style={styles.dropdown}>
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) => setCategory(itemValue)}
            >
              {categoryOptions.map((cat) => (
                <Picker.Item
                  key={cat.category_id}
                  label={cat.name}
                  value={cat.name}
                />
              ))}
            </Picker>
          </View>

          <TextInput
            placeholder="Description"
            style={[styles.input, styles.descriptionInput]}
            multiline
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.postButton, loading && { backgroundColor: "#888" }]}
            onPress={handlePost}
            disabled={loading}
          >
            <Text style={styles.postButtonText}>
              {loading ? "Posting..." : "Post"}
            </Text>
          </TouchableOpacity>
          
          {/* Extra space at bottom for better scrolling */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Loading Modal */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#FFA500" />
            <Text style={{ marginTop: 12, fontWeight: "bold" }}>
              Uploading, please wait...
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF5E9",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#FFF5E9",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40, // Extra padding at bottom
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: "#aaa",
    height: 150,
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  imagePickerText: {
    textAlign: "center",
    color: "#444",
    fontSize: 16,
    marginTop: 8,
  },
  itemImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    paddingTop: 15,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  postButton: {
    backgroundColor: "#000",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
  postButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  bottomSpacer: {
    height: 50, // Extra space at bottom for better keyboard handling
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingBox: {
    backgroundColor: "#fff",
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});