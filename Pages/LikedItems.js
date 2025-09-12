"use client"

import { useEffect, useState } from "react"
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { supabase } from "../lib/supabase"
import { AntDesign, Ionicons } from "@expo/vector-icons"

export default function LikedItemsScreen({ navigation }) {
  const [likedItems, setLikedItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchLikedItems = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from("liked_items")
          .select(`
            id,
            items (
              item_id,
              title,
              price_per_day,
              image_url,
              user_id,
              categories (
                name
              )
            )
          `)
          .eq("user_id", user.id)

        if (error) {
          console.error("Error fetching liked items:", error)
        } else {
          const itemsWithOwners = await Promise.all(
            (data || []).map(async (likedItem) => {
              if (likedItem.items?.user_id) {
                const { data: ownerData } = await supabase
                  .from("users")
                  .select("first_name, last_name")
                  .eq("user_id", likedItem.items.user_id)
                  .single()

                return {
                  ...likedItem,
                  items: {
                    ...likedItem.items,
                    owner: ownerData,
                  },
                }
              }
              return likedItem
            }),
          )

          setLikedItems(itemsWithOwners)
          setFilteredItems(itemsWithOwners)
        }
      } catch (err) {
        console.error("Failed to fetch liked items:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchLikedItems()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredItems(likedItems)
    } else {
      const filtered = likedItems.filter((item) => item.items.title.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredItems(filtered)
    }
  }, [searchQuery, likedItems])

  const removeLikedItem = async (likedItemId, itemId) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("liked_items").delete().eq("user_id", user.id).eq("item_id", itemId)

      if (error) throw error

      const updatedItems = likedItems.filter((item) => item.id !== likedItemId)
      setLikedItems(updatedItems)
      setFilteredItems(updatedItems)
    } catch (err) {
      console.error("Error removing liked item:", err)
      alert("Failed to remove item from favorites")
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#FF9900" style={{ marginTop: 40 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liked Items</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Liked Items..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.container}>
        {filteredItems.length === 0 ? (
          <Text style={styles.emptyText}>
            {searchQuery ? "No items found matching your search" : "NO FOLLOWING LIKED ITEMS"}
          </Text>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const owner =
                `${item.items.owner?.first_name || ""} ${item.items.owner?.last_name || ""}`.trim() || "Unknown Owner"
              const category = item.items.categories?.name || "Others"

              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => navigation.navigate("ItemDetails", { item: item.items })}
                >
                  <Image source={{ uri: item.items.image_url }} style={styles.image} />

                  <View style={styles.info}>
                    <Text style={styles.itemTitle}>{item.items.title}</Text>
                    <Text style={styles.price}>₱{item.items.price_per_day} per day</Text>

                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{category}</Text>
                    </View>

                    <View style={styles.ownerRow}>
                      <AntDesign name="user" size={14} color="#555" />
                      <Text style={styles.ownerName}>{owner}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.heartContainer}
                    onPress={() => removeLikedItem(item.id, item.items.item_id)}
                  >
                    <AntDesign name="heart" size={22} color="red" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )
            }}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FDF2E9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FDF2E9",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 4,
  },
  container: {
    flex: 1,
    backgroundColor: "#FDF2E9",
    paddingHorizontal: 12,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
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
    padding: 8,
  },
})
