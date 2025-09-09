import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase"; // adjust path if different

const categories = ["Tools", "Car", "Clothing & Accessories", "More..."];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("available", true)
      .eq("is_verified", true);

    if (error) {
      console.error("Error fetching items:", error);
    } else {
      setItems(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate("ItemDetails", { item })}
    >
      <View style={styles.card}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardUser}>{item.location}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>₱{item.price_per_day}</Text>
            <TouchableOpacity>
              <AntDesign name="hearto" size={18} color="#FF9900" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: 0 }]}
    >
      <View style={styles.headerRow}>
        <Ionicons name="menu" size={24} color="#000" />
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.searchButton}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <AntDesign name="hearto" size={26} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.categoryScroll, { marginBottom: 16 }]}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map((cat, idx) => (
          <TouchableOpacity key={idx} style={styles.categoryButton}>
            <Text style={styles.categoryText}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.itemsTitle}>Items</Text>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#FF9900"
          style={{ marginTop: 30 }}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.item_id?.toString()}
          numColumns={2}
          contentContainerStyle={[styles.itemsList, { paddingBottom: 120 }]}
          renderItem={renderItem}
        />
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="home" size={24} color="#000" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Inbox")}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#000" />
          <Text style={styles.navText}>Inbox</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("PostItems")}
        >
          <AntDesign name="plus" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Notification")}
        >
          <Ionicons name="notifications-outline" size={24} color="#000" />
          <Text style={styles.navText}>Notification</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <Ionicons name="person-outline" size={24} color="#000" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF5E9",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    justifyContent: "space-between",
    backgroundColor: "#FFF5E9",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 10,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    paddingVertical: 0,
  },
  searchButton: {
    backgroundColor: "#FF9900",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 6,
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  categoryScroll: {
    marginTop: 8,
    maxHeight: 38,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  categoryButton: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#FF9900",
  },
  categoryText: {
    color: "#FF9900",
    fontWeight: "bold",
    fontSize: 13,
  },
  itemsTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 18,
    marginTop: 18,
    marginBottom: 8,
    color: "#222",
  },
  itemsList: {
    paddingHorizontal: 10,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 7,
    flex: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    overflow: "hidden",
    minWidth: 160,
    maxWidth: "48%",
  },
  cardImage: {
    width: "100%",
    height: 90,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 10,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#222",
  },
  cardUser: {
    fontSize: 11,
    color: "#888",
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardPrice: {
    color: "#FF9900",
    fontWeight: "bold",
    fontSize: 13,
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    paddingBottom: 10,
  },
  navItem: {
    bottom: 0,
    alignItems: "center",
    flex: 1,
  },
  navText: {
    fontSize: 11,
    color: "#222",
    marginTop: 2,
  },
  addButton: {
    backgroundColor: "#000",
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -32,
    borderWidth: 4,
    borderColor: "#FFF5E9",
    elevation: 5,
  },
});
