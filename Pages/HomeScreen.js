"use client"

import { useEffect, useState, useCallback } from "react"
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
} from "react-native"
import { Ionicons, AntDesign } from "@expo/vector-icons"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { supabase } from "../lib/supabase" // adjust path if different

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [categories, setCategories] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [likedItemsCount, setLikedItemsCount] = useState(0)

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("name").order("name")

    if (error) {
      console.error("Error fetching categories:", error)
    } else {
      setCategories(data.map((cat) => cat.name))
    }
  }

  const fetchLikedItemsCount = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data, error } = await supabase.from("liked_items").select("*").eq("user_id", user.id)

      if (!error && data) {
        setLikedItemsCount(data.length)
      }
    }
  }

  const fetchItems = async (categoryFilter = null, search = "") => {
    setLoading(true)
    let query = supabase.from("items").select("*").eq("available", true).eq("is_verified", true)

    if (categoryFilter && categoryFilter !== "All") {
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("category_id")
        .eq("name", categoryFilter)
        .single()

      if (categoryError || !categoryData) {
        console.error("Error fetching category ID:", categoryError)
        setLoading(false)
        return
      }

      query = supabase
        .from("items")
        .select("*")
        .eq("available", true)
        .eq("is_verified", true)
        .eq("category_id", categoryData.category_id)
    }

    if (search.trim()) {
      query = query.ilike("title", `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching items:", error)
    } else {
      setItems(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchCategories()
    fetchLikedItemsCount()
  }, [])

  useEffect(() => {
    fetchItems(selectedCategory === "All" ? null : selectedCategory, searchQuery)
  }, [selectedCategory, searchQuery])

  useFocusEffect(
    useCallback(() => {
      fetchLikedItemsCount()
    }, []),
  )

  const handleCategoryPress = (category) => {
    setSelectedCategory(category)
  }

  const handleSearch = () => {
    fetchItems(selectedCategory === "All" ? null : selectedCategory, searchQuery)
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate("ItemDetails", { item })} style={styles.cardWrapper}>
      <View style={styles.card}>
        <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.cardUser} numberOfLines={1}>
            {item.location}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardPrice}>₱{item.price_per_day}/day</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: 0 }]}>
      <View style={styles.headerRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#FF9900"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("LikedItems")} style={styles.likesContainer}>
          <AntDesign name="heart" size={26} color="#000" />
          {likedItemsCount > 0 && (
            <View style={styles.likesBadge}>
              <Text style={styles.likesBadgeText}>{likedItemsCount}</Text>
            </View>
          )}
          <Text style={styles.likesText}>Likes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.categoryScroll, { marginBottom: 16 }]}
        contentContainerStyle={styles.categoryContainer}
      >
        <TouchableOpacity
          key="all"
          style={[styles.categoryButton, selectedCategory === "All" && styles.selectedCategoryButton]}
          onPress={() => handleCategoryPress("All")}
        >
          <Text style={[styles.categoryText, selectedCategory === "All" && styles.selectedCategoryText]}>All</Text>
        </TouchableOpacity>
        {categories.map((cat, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.categoryButton, selectedCategory === cat && styles.selectedCategoryButton]}
            onPress={() => handleCategoryPress(cat)}
          >
            <Text style={[styles.categoryText, selectedCategory === cat && styles.selectedCategoryText]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.itemsTitle}>Items</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#FF9900" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.item_id?.toString()}
          numColumns={2}
          contentContainerStyle={[styles.itemsList, { paddingBottom: 100 }]}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="home" size={24} color="#000" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Inbox")}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#000" />
          <Text style={styles.navText}>Inbox</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("PostItems")}>
          <AntDesign name="plus" size={32} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Notification")}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
          <Text style={styles.navText}>Notification</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-outline" size={24} color="#000" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
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
    paddingTop: 1,
    paddingBottom: 8,
    justifyContent: "space-between",
    backgroundColor: "#FFF5E9",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 15,
    backgroundColor: "#fff",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#FF9900",
    fontWeight: "500",
    paddingVertical: 0,
  },
  searchButton: {
    backgroundColor: "transparent",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  searchButtonText: {
    color: "#FF9900",
    fontWeight: "bold",
    fontSize: 16,
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
    marginTop: 10,
    marginBottom: 8,
    color: "#222",
  },
  itemsList: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  cardWrapper: {
    flex: 1,
    margin: 6,
    maxWidth: "48%",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    flex: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#222",
    marginBottom: 4,
    lineHeight: 20,
  },
  cardUser: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardPrice: {
    color: "#FF9900",
    fontWeight: "bold",
    fontSize: 14,
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
  selectedCategoryButton: {
    backgroundColor: "#FF9900",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  likesContainer: {
    alignItems: "center",
    position: "relative",
  },
  likesBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFF5E9",
  },
  likesBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  likesText: {
    fontSize: 12,
    color: "#000",
    marginTop: 2,
    fontWeight: "500",
  },
})
