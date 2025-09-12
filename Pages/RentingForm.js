import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { Ionicons, FontAwesome, Entypo } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;
import DateTimePicker from "@react-native-community/datetimepicker";
import DropDownPicker from "react-native-dropdown-picker";
import { supabase } from '../lib/supabase';

export default function RentingForm({ route, navigation }) {
  const { item } = route.params;

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("Gcash");
  const [deliveryMethod, setDeliveryMethod] = useState("Pickup");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  
  
  // User info states
  const [userInfo, setUserInfo] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: ""
  });
  const [userLoading, setUserLoading] = useState(true);

  const [paymentItems, setPaymentItems] = useState([
    { label: "Gcash", value: "Gcash" },
    { label: "PayMaya", value: "PayMaya" },
    { label: "Bank Transfer", value: "Bank" },
  ]);

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please allow access to your gallery in settings."
        );
      }
    })();

    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("User not authenticated");
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("first_name, last_name, phone, address")
        .eq("user_id", user.id)
        .single();

      if (userError) {
        console.error("Error fetching user info:", userError);
      } else {
        setUserInfo({
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          phone: userData.phone || "",
          address: userData.address || ""
        });
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    } finally {
      setUserLoading(false);
    }
  };

  const pickReceipt = async () => {
    Alert.alert(
      "Select Receipt",
      "Choose how you want to upload your deposit receipt",
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
      setReceipt({
        uri: result.assets[0].uri,
        name: `receipt_${Date.now()}.jpg`,
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
      setReceipt({
        uri: result.assets[0].uri,
        name: `receipt_${Date.now()}.jpg`,
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
        setReceipt({
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          type: result.assets[0].mimeType,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const uploadReceipt = async (receipt) => {
    if (!receipt) return null;
    try {
      const fileExt = receipt.name.split(".").pop();
      const filePath = `receipts/${Date.now()}.${fileExt}`;
      const fileData = await FileSystem.readAsStringAsync(receipt.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const contentType = receipt.type || "image/jpeg";

      const { error } = await supabase.storage
        .from("receipts")
        .upload(filePath, Buffer.from(fileData, "base64"), {
          contentType,
          upsert: true,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from("receipts")
        .getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Upload receipt error:", error);
      return null;
    }
  };

  const handleConfirmRental = async () => {
    if (!receipt) {
      Alert.alert("Missing Information", "Please upload the deposit receipt.");
      return;
    }
    if (startDate > endDate) {
      Alert.alert("Invalid Dates", "Start date cannot be after end date.");
      return;
    }

    setLoading(true);

    try {
      const receiptUrl = await uploadReceipt(receipt);
      if (!receiptUrl) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("User not authenticated");
      }

      const { data: userInfo, error: userInfoError } = await supabase
        .from("users")
        .select("legacy_id")
        .eq("user_id", user.id)
        .single();

      if (userInfoError || !userInfo) {
        throw new Error("User record not found");
      }

      const rentalData = {
  item_id: item.id,
  user_id: userInfo.legacy_id,
  start_date: startDate.toISOString().split("T")[0],
  end_date: endDate.toISOString().split("T")[0],
  total_cost: estimatedTotal,
  status: "pending",
  proof_of_deposit: receiptUrl,
  payment_method: paymentMethod,
  delivery_method: deliveryMethod,
  quantity, 
};

      const { error } = await supabase
        .from("rental_transactions")
        .insert([rentalData]);

      if (error) throw error;

      Alert.alert("Success", "Rental transaction submitted!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert("Error", `Failed to confirm rental: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalDays =
    Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const estimatedTotal = totalDays * parseFloat(item.price_per_day || 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.header}>Renting Form</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true} // <-- Add this line
        >
          {/* Item Section */}
          <View style={styles.itemSection}>
            <Image source={{ uri: item.image_url }} style={styles.itemImage} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemPrice}>₱{item.price_per_day}/{item.payment_interval || "day"}</Text>
              <Text style={styles.itemDeposit}>Deposit: ₱{item.deposit_fee}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
  <Text style={{ fontSize: 16, fontWeight: "bold", marginRight: 12 }}>Quantity:</Text>
  <TouchableOpacity
    onPress={() => setQuantity(q => Math.max(1, q - 1))}
    style={{
      padding: 8,
      backgroundColor: "#eee",
      borderRadius: 8,
      marginRight: 8,
      opacity: quantity === 1 ? 0.5 : 1,
    }}
    disabled={quantity === 1}
  >
    <Text style={{ fontSize: 18 }}>-</Text>
  </TouchableOpacity>
  <Text style={{ fontSize: 16, minWidth: 32, textAlign: "center" }}>{quantity}</Text>
  <TouchableOpacity
    onPress={() => setQuantity(q => Math.min(item.quantity, q + 1))}
    style={{
      padding: 8,
      backgroundColor: "#eee",
      borderRadius: 8,
      marginLeft: 8,
      opacity: quantity === item.quantity ? 0.5 : 1,
    }}
    disabled={quantity === item.quantity}
  >
    <Text style={{ fontSize: 18 }}>+</Text>
  </TouchableOpacity>
  <Text style={{ marginLeft: 12, color: "#888" }}>
    (Available: {item.quantity})
  </Text>
</View>

          {/* Rental Duration Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Duration</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Start Date:</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowStart(true)}
                >
                  <Text style={styles.dateText}>{startDate.toDateString()}</Text>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>End Date:</Text>
                <TouchableOpacity 
                  style={styles.dateButton}
                  onPress={() => setShowEnd(true)}
                >
                  <Text style={styles.dateText}>{endDate.toDateString()}</Text>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Days:</Text>
                <Text style={styles.infoValue}>{totalDays} days</Text>
              </View>
              <View style={[styles.infoRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Estimated Total:</Text>
                <Text style={styles.totalValue}>₱{estimatedTotal.toFixed(2)}</Text>
              </View>
            </View>
            {showStart && (
              <DateTimePicker
                value={startDate}
                mode="date"
                minimumDate={new Date()}
                onChange={(e, date) => {
                  setShowStart(false);
                  if (date) setStartDate(date);
                }}
              />
            )}
            {showEnd && (
              <DateTimePicker
                value={endDate}
                mode="date"
                minimumDate={startDate}
                onChange={(e, date) => {
                  setShowEnd(false);
                  if (date) setEndDate(date);
                }}
              />
            )}
          </View>

          {/* Renter Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Renter Information</Text>
            <View style={styles.infoCard}>
              {userLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFA500" />
                  <Text style={styles.loadingText}>Loading your information...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>First Name:</Text>
                    <Text style={styles.infoValue}>{userInfo.first_name || "Not provided"}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Last Name:</Text>
                    <Text style={styles.infoValue}>{userInfo.last_name || "Not provided"}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone:</Text>
                    <Text style={styles.infoValue}>{userInfo.phone || "Not provided"}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Address:</Text>
                    <Text style={styles.infoValue}>{userInfo.address || "Not provided"}</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Deposit Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deposit Receipt</Text>
            <View style={styles.infoCard}>
              <TouchableOpacity style={styles.uploadRow} onPress={pickReceipt}>
                <View style={styles.uploadLeft}>
                  <Text style={styles.infoLabel}>Receipt Upload:</Text>
                  {receipt && (
                    <Image
                      source={{ uri: receipt.uri }}
                      style={styles.receiptThumbnail}
                    />
                  )}
                </View>
                <View style={styles.uploadRight}>
                  {receipt ? (
                    <View style={styles.uploadSuccess}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.uploadSuccessText}>Receipt uploaded</Text>
                      <Text style={styles.changeText}>Tap to change</Text>
                    </View>
                  ) : (
                    <View style={styles.uploadPrompt}>
                      <Entypo name="upload" size={20} color="#FFA500" />
                      <Text style={styles.uploadText}>Upload Receipt</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Payment Method Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <DropDownPicker
              open={paymentOpen}
              value={paymentMethod}
              items={paymentItems}
              setOpen={setPaymentOpen}
              setValue={setPaymentMethod}
              setItems={setPaymentItems}
              containerStyle={styles.dropdownContainer}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropdownList}
              textStyle={styles.dropdownText}
              zIndex={3000}
              zIndexInverse={1000}
            />
          </View>

          {/* Delivery Method Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Method</Text>
            <View style={styles.deliveryOptions}>
              {["Pickup", "Delivery"].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.deliveryButton,
                    deliveryMethod === option && styles.deliveryButtonSelected,
                  ]}
                  onPress={() => setDeliveryMethod(option)}
                >
                  <FontAwesome
                    name={option === "Pickup" ? "hand-paper-o" : "truck"}
                    size={18}
                    color={deliveryMethod === option ? "#FFA500" : "#666"}
                  />
                  <Text style={[
                    styles.deliveryText,
                    deliveryMethod === option && styles.deliveryTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            onPress={handleConfirmRental}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.confirmText}>Confirm Rental</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDF2E9",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FDF2E9",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
    gap: 12,
  },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  itemSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    color: "#FF9900",
    fontWeight: "600",
    marginBottom: 2,
  },
  itemDeposit: {
    fontSize: 14,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
    color: "#333",
  },
  infoCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 2,
    textAlign: "right",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#333",
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#FFA500",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF9900",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    color: "#666",
  },
  uploadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  uploadLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  uploadRight: {
    alignItems: "flex-end",
  },
  receiptThumbnail: {
    width: 40,
    height: 30,
    borderRadius: 4,
    marginLeft: 8,
  },
  uploadSuccess: {
    alignItems: "center",
  },
  uploadSuccessText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  changeText: {
    fontSize: 10,
    color: "#FFA500",
  },
  uploadPrompt: {
    alignItems: "center",
  },
  uploadText: {
    fontSize: 12,
    color: "#FFA500",
    fontWeight: "600",
    marginTop: 2,
  },
  dropdownContainer: {
    height: 50,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderRadius: 8,
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
  },
  deliveryOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  deliveryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    gap: 8,
  },
  deliveryButtonSelected: {
    backgroundColor: "#FFF5E9",
    borderColor: "#FFA500",
    borderWidth: 2,
  },
  deliveryText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  deliveryTextSelected: {
    color: "#FFA500",
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    marginTop: 20,
    borderRadius: 25,
    alignItems: "center",
    elevation: 2,
  },
  confirmButtonDisabled: {
    backgroundColor: "#888",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  bottomSpacer: {
    height: 20,
  },
});