"use client"

import { useEffect, useState, useCallback } from "react"
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, FlatList } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons, AntDesign } from "@expo/vector-icons"
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { supabase } from "../lib/supabase" // Adjust path if needed

const transactions = [
  { key: "Active Rental", icon: "time", color: "#FF9900", status: "ongoing" },
  { key: "Pending", icon: "hourglass", color: "#FFB84C", status: "pending" },
  { key: "Completed", icon: "checkmark-circle-outline", color: "#4CAF50", status: "completed" },
  { key: "Activity", icon: "list", color: "#888", status: "all" },
]
const items = [
  {
    id: "1",
    title: "Hand Tools Set",
    location: "Iligan, OpoI",
    date: "April 11-12",
    price: "₱180.65",
    image: require("../assets/tools.jpg"),
  },
  {
    id: "2",
    title: "House/Pool",
    location: "Cagayan de Oro",
    date: "April 10-10",
    price: "₱56,756",
    image: require("../assets/house.jpg"),
  },
  {
    id: "3",
    title: "Lamborghini Set",
    location: "Carmen, Cdo",
    date: "April 1-4",
    price: "₱50,000",
    image: require("../assets/car.jpg"),
  },
  {
    id: "4",
    title: "Kitchenware Set",
    location: "Carmen, Cdo",
    date: "April 9-10",
    price: "₱200",
    image: require("../assets/kitchenware.jpg"),
  },
]

export default function ProfileDefault() {
  const navigation = useNavigation()
  const [userInfo, setUserInfo] = useState({ name: "", id: "", legacyId: "" })
  const [transactionCounts, setTransactionCounts] = useState({
    ongoing: 0,
    pending: 0,
    completed: 0,
    all: 0,
  })
  const [isLoading, setIsLoading] = useState(false) // Added loading state

  const fetchTransactionCounts = async (userId) => {
    if (!userId) return

    try {
      setIsLoading(true)
      const { data: allTransactions, error } = await supabase
        .from("rental_transactions")
        .select("status")
        .eq("user_id", userId)

      if (error) {
        console.error("Error fetching transactions:", error)
        return
      }

      const counts = {
        ongoing: 0,
        pending: 0,
        completed: 0,
        cancelled: 0,
        confirmed: 0,
        all: allTransactions?.length || 0,
      }

      allTransactions?.forEach((transaction) => {
        if (counts.hasOwnProperty(transaction.status)) {
          counts[transaction.status]++
        }
      })

      setTransactionCounts(counts)
    } catch (error) {
      console.error("Failed to fetch transaction counts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshData = useCallback(async () => {
    if (userInfo.legacyId) {
      await fetchTransactionCounts(userInfo.legacyId)
    }
  }, [userInfo.legacyId])

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (user && !userError) {
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("first_name, last_name, user_id, legacy_id")
          .eq("user_id", user.id)
          .single()

        if (profile && !profileError) {
          setUserInfo({
            name: `${profile.first_name} ${profile.last_name}`,
            id: profile.user_id,
            legacyId: profile.legacy_id,
          })

          await fetchTransactionCounts(profile.legacy_id)
        }
      }
    }

    fetchUser()
  }, [])

  useFocusEffect(
    useCallback(() => {
      if (userInfo.legacyId) {
        fetchTransactionCounts(userInfo.legacyId)
      }
    }, [userInfo.legacyId]),
  )

  const handleTransactionPress = (transaction) => {
    console.log(`[v0] Navigating to ${transaction.key} with status: ${transaction.status}`)

    const count = transaction.status === "all" ? transactionCounts.all : transactionCounts[transaction.status] || 0

    alert(`${transaction.key}: ${count} transactions`)

    // TODO: Navigate to actual transaction screens
    // navigation.navigate("TransactionList", { status: transaction.status });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <Text style={styles.profileTitle}>Profile</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={refreshData} disabled={isLoading}>
            <Ionicons name="refresh" size={24} color={isLoading ? "#ccc" : "#222"} style={{ marginRight: 10 }} />
          </TouchableOpacity>
          <Ionicons name="menu" size={28} color="#222" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.profileCard}>
          <View style={styles.avatarRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={54} color="#bbb" />
            </View>
            <View style={styles.nameColumn}>
              <Text style={styles.userName}>{userInfo.name}</Text>
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate("EditProfile")}>
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Transaction Management</Text>
        <View style={styles.transactionRow}>
          {transactions.map((t) => {
            const count = t.status === "all" ? transactionCounts.all : transactionCounts[t.status] || 0

            return (
              <TouchableOpacity style={styles.transactionItem} key={t.key} onPress={() => handleTransactionPress(t)}>
                <Ionicons name={t.icon} size={28} color={t.color} />
                <Text style={styles.transactionText}>{t.key}</Text>
                <View style={[styles.countBadge, { backgroundColor: t.color }]}>
                  <Text style={styles.countText}>{count}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Items for you</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.itemsList}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={item.image} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardLocation}>{item.location}</Text>
                <Text style={styles.cardDate}>{item.date}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrice}>{item.price}</Text>
                  <AntDesign name="hearto" size={18} color="#FF9900" />
                </View>
              </View>
            </View>
          )}
        />
      </ScrollView>

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
          <Ionicons name="person" size={24} color="#000" />
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
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
  },
  profileTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#222",
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    margin: 18,
    marginBottom: 10,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },
  nameColumn: {
    flex: 1,
    justifyContent: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  userId: {
    fontSize: 13,
    color: "#888",
    marginBottom: 8,
  },
  editBtn: {
    backgroundColor: "#FFB84C",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 5,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  editBtnText: {
    color: "#222",
    fontWeight: "bold",
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
    marginLeft: 18,
    marginTop: 18,
    marginBottom: 8,
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  transactionItem: {
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  transactionText: {
    fontSize: 12,
    color: "#222",
    marginTop: 4,
  },
  countBadge: {
    position: "absolute",
    top: -5,
    right: 10,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  countText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
    marginHorizontal: 18,
  },
  itemsList: {
    paddingHorizontal: 10,
    paddingBottom: 120,
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
  cardLocation: {
    fontSize: 11,
    color: "#888",
  },
  cardDate: {
    fontSize: 11,
    color: "#888",
    marginBottom: 4,
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
    bottom: 10,
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
})
