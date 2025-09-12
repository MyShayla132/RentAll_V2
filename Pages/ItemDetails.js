import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, AntDesign, FontAwesome } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

// Inside ItemDetailScreen.js
export default function ItemDetailScreen({ route, navigation }) {
  const { item } = route.params;
  const [liked, setLiked] = useState(false); // track if liked
  const [loadingLike, setLoadingLike] = useState(false);

  useEffect(() => {
    const checkIfLiked = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("liked_items")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_id", item.item_id)
        .single();

      if (data) setLiked(true);
    };

    checkIfLiked();
  }, [item.item_id]);

  const toggleLike = async () => {
  setLoadingLike(true);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (liked) {
      // Unlike
      const { error } = await supabase
        .from("liked_items")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", item.item_id);

      if (error) throw error;
      setLiked(false);
    } else {
      // Like (safe insert with upsert to avoid duplicates)
      const { error } = await supabase.from("liked_items").upsert(
        [
          {
            user_id: user.id,
            item_id: item.item_id,
          },
        ],
        { onConflict: ["user_id", "item_id"] }
      );

      if (error) throw error;
      setLiked(true);
    }
  } catch (err) {
    console.error("Error toggling like:", err.message);
    alert("Something went wrong. Please try again.");
  } finally {
    setLoadingLike(false);
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Image */}
          <Image
            source={{ uri: item.image_url }}
            style={styles.itemImage}
            resizeMode="cover"
          />

          {/* Price */}
          <Text style={styles.price}>
            ₱{parseFloat(item.price_per_day).toFixed(2)}
            <Text style={styles.priceInterval}> / {item.payment_interval || "Per Day"}</Text>
          </Text>

          {/* Title & Location */}
          <View style={styles.section}>
          <Text style={styles.title}>{item.title}</Text>
</View>


          {/* Rental Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rental Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
  <Text style={styles.infoLabel}>Available Quantity:</Text>
  <Text style={styles.infoValue}>{item.quantity}</Text>
</View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Deposit Required:</Text>
                <Text style={styles.infoValue}>₱{parseFloat(item.deposit_fee || 0).toFixed(2)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Payment Interval:</Text>
                <Text style={styles.infoValue}>{item.payment_interval || "Per Day"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Description:</Text>
                <Text style={styles.descriptionText}>{item.description}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.location}>{item.location}</Text>
              </View>
            </View>
          </View>

          {/* Ratings */}
          <View style={styles.section}>
            <View style={styles.reviewCard}>
              <View style={styles.ratingHeader}>
              <Text style={styles.ratingValue}>5.0</Text>
              <Text style={styles.ratingLabel}>Product Ratings (100)</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>
              <Text style={styles.reviewer}>tralalelomimimi</Text>
              <View style={styles.stars}>
                {Array(5)
                  .fill()
                  .map((_, idx) => (
                    <FontAwesome
                      key={idx}
                      name="star"
                      size={16}
                      color="#FFA500"
                    />
                  ))}
              </View>
              <Text style={styles.reviewText}>
                This tool set didn't just fix my broken shelf—it fixed a piece
                of my soul.
              </Text>
            </View>
          </View>

          {/* Extra space at bottom */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.ownerInfo}>
            {ownerLoading ? (
              <View style={styles.ownerLoadingContainer}>
                <ActivityIndicator size="small" color="#FFA500" />
                <Text style={styles.ownerLoadingText}>Loading...</Text>
              </View>
            ) : (
              
              <Text style={styles.ownerBottomName}>
  <Text style={{ fontWeight: "bold" }}>Owner:</Text> {ownerName}
</Text>
            )} 
          </View>
          <TouchableOpacity
  style={styles.actionButton}
  onPress={toggleLike}
  disabled={loadingLike}
>
  {loadingLike ? (
    <ActivityIndicator size="small" color="red" />
  ) : (
    <AntDesign
      name={liked ? "heart" : "hearto"}
      size={24}
      color={liked ? "red" : "#000"}
    />
  )}
</TouchableOpacity>


          <TouchableOpacity
            style={styles.rentButton}
            onPress={() => navigation.navigate("RentingForm", { item })}
          >
            <Text style={styles.rentButtonText}>Rent Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDF2E9",
  },
  container: { 
    flex: 1 
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FDF2E9",
  },
  likeIcon: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  likesCount: { 
    marginLeft: 4, 
    fontWeight: "bold" 
  },
  itemImage: { 
    width: "100%", 
    height: 250, 
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF9900",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  priceInterval: {
    fontSize: 16,
    fontWeight: "normal",
    color: "#666",
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
    color: "#333",
  },
  location: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
  },
  ownerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  ownerLabel: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  section: { 
    marginHorizontal: 16, 
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
    color: "#333",
  },
  sectionSubtitle: {
    fontWeight: "600",
    marginBottom: 8,
    color: "#666",
    fontSize: 14,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#444",
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
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  availableStatus: {
    color: "#4CAF50",
  },
  ratingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  ratingValue: { 
    fontWeight: "bold", 
    fontSize: 18,
    color: "#333",
  },
  ratingLabel: { 
    fontSize: 14, 
    color: "#444" 
  },
  viewAll: { 
    marginLeft: "auto", 
    color: "#007BFF", 
    fontSize: 13,
    fontWeight: "500",
  },
  reviewCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  reviewer: { 
    fontWeight: "bold", 
    marginBottom: 6,
    fontSize: 15,
  },
  stars: { 
    flexDirection: "row", 
    marginBottom: 8 
  },
  reviewText: { 
    fontSize: 14, 
    color: "#555",
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    elevation: 5,
  },
  ownerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  section: { 
    marginHorizontal: 16, 
    marginBottom: 20,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
    color: "#333",
  },
  sectionSubtitle: {
    fontWeight: "600",
    marginBottom: 8,
    color: "#666",
    fontSize: 14,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 22,
    color: "#444",
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
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  availableStatus: {
    color: "#4CAF50",
  },
  ratingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  ratingValue: { 
    fontWeight: "bold", 
    fontSize: 18,
    color: "#333",
  },
  ratingLabel: { 
    fontSize: 14, 
    color: "#444" 
  },
  viewAll: { 
    marginLeft: "auto", 
    color: "#007BFF", 
    fontSize: 13,
    fontWeight: "500",
  },
  reviewCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  reviewer: { 
    fontWeight: "bold", 
    marginBottom: 6,
    fontSize: 15,
  },
  stars: { 
    flexDirection: "row", 
    marginBottom: 8 
  },
  reviewText: { 
    fontSize: 14, 
    color: "#555",
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    elevation: 5,
  },
  actionButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  rentButton: {
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  rentButtonText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 14,
  },
});