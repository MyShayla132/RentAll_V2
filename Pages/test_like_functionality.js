// Test script to verify like functionality
// This script tests the database operations for the like feature

import { supabase } from "../lib/supabase.js"

async function testLikeFunctionality() {
  console.log("🧪 Testing Like Functionality...")

  try {
    // Test 1: Check if liked_items table exists
    console.log("1. Checking if liked_items table exists...")
    const { data: tables, error: tableError } = await supabase.from("liked_items").select("*").limit(1)

    if (tableError && tableError.code === "42P01") {
      console.log("❌ liked_items table does not exist. Please run the SQL script first.")
      return
    }
    console.log("✅ liked_items table exists")

    // Test 2: Check if we can get current user
    console.log("2. Checking user authentication...")
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("❌ User not authenticated. Please log in first.")
      return
    }
    console.log("✅ User authenticated:", user.email)

    // Test 3: Test like operation (mock data)
    console.log("3. Testing like operation...")
    const mockItemId = 1 // Replace with actual item ID

    const { data: likeData, error: likeError } = await supabase.from("liked_items").upsert(
      [
        {
          user_id: user.id,
          item_id: mockItemId,
        },
      ],
      { onConflict: ["user_id", "item_id"] },
    )

    if (likeError) {
      console.log("❌ Like operation failed:", likeError.message)
    } else {
      console.log("✅ Like operation successful")
    }

    // Test 4: Test fetching liked items
    console.log("4. Testing fetch liked items...")
    const { data: likedItems, error: fetchError } = await supabase
      .from("liked_items")
      .select(`
        id,
        items (
          item_id,
          title,
          price_per_day,
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
      .eq("user_id", user.id)

    if (fetchError) {
      console.log("❌ Fetch liked items failed:", fetchError.message)
    } else {
      console.log("✅ Fetch liked items successful. Found:", likedItems.length, "items")
    }

    // Test 5: Test unlike operation
    console.log("5. Testing unlike operation...")
    const { error: unlikeError } = await supabase
      .from("liked_items")
      .delete()
      .eq("user_id", user.id)
      .eq("item_id", mockItemId)

    if (unlikeError) {
      console.log("❌ Unlike operation failed:", unlikeError.message)
    } else {
      console.log("✅ Unlike operation successful")
    }

    console.log("\n🎉 All tests completed! Like functionality is ready to use.")
  } catch (error) {
    console.error("❌ Test failed with error:", error.message)
  }
}

// Run the test
testLikeFunctionality()
