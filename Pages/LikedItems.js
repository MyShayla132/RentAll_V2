import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { supabase } from "../lib/supabase";
import { AntDesign } from "@expo/vector-icons"; // icons

export default function LikedItemsScreen({ navigation }) {
  const [likedItems, setLikedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikedItems = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("liked_items")
          .select(`
            id,
            items (
              item_id,
              title,
              price_per_day,
              days,
              image_url,
              users (
                first_name,
                last_name
              ),
              categories (
                name
              )
            )
          `)
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching liked items:", error);
        } else {
          setLikedItems(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch liked items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedItems();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      {likedItems.length === 0 ? (
        <Text style={styles.emptyText}>NO FOLLOWING LIKED ITEMS</Text>
      ) : (
        <FlatList
          data={likedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const owner =
              `${item.items.users?.first_name || ""} ${
                item.items.users?.last_name || ""
              }`.trim() || "Unknown Owner";
            const category = item.items.categories?.name || "Others";

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate("ItemDetail", { item: item.items })
                }
              >
                {/* Left: Image */}
                <Image
                  source={{ uri: item.items.image_url }}
                  style={styles.image}
                />

                {/* Middle: Info */}
                <View style={styles.info}>
                  <Text style={styles.itemTitle}>{item.items.title}</Text>
                  <Text style={styles.price}>
                    ₱{item.items.price_per_day} for {item.items.days || 1} day/s
                  </Text>

                  {/* Category Badge */}
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{category}</Text>
                  </View>

                  {/* Owner Row */}
                  <View style={styles.ownerRow}>
                    <AntDesign name="user" size={14} color="#555" />
                    <Text style={styles.ownerName}>{owner}</Text>
                  </View>
                </View>

                {/* Right: Heart */}
                <View style={styles.heartContainer}>
                  <AntDesign name="heart" size={22} color="red" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 12 },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#777",
    fontSize: 14,
    fontWeight: "500",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 10,
  },
  info: { flex: 1, justifyContent: "center" },
  itemTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 2 },
  price: { fontSize: 14, color: "#333", marginBottom: 6 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFD966",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 6,
  },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#333" },
  ownerRow: { flexDirection: "row", alignItems: "center" },
  ownerName: { marginLeft: 4, fontSize: 13, color: "#555" },
  heartContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 6,
  },
});
