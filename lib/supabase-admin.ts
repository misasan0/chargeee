import { createClient } from "@supabase/supabase-js"
import type { User, Message, Activity, Stats } from "@/types/admin"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

const supabase = createClient(supabaseUrl, supabaseKey)

export async function getUsers(searchQuery?: string) {
  let query = supabase.from("users").select("*").order("created_at", { ascending: false })

  if (searchQuery) {
    query = query.or(
      `username.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,telegram_id.ilike.%${searchQuery}%`,
    )
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching users:", error)
    throw error
  }

  return data as User[]
}

export async function getMessages(searchQuery?: string, messageType?: string) {
  let query = supabase
    .from("messages")
    .select("*, user:users(username, first_name, last_name)")
    .order("created_at", { ascending: false })

  if (searchQuery) {
    query = query.or(
      `message_text.ilike.%${searchQuery}%,telegram_id.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`,
    )
  }

  if (messageType && messageType !== "all") {
    query = query.eq("message_type", messageType)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching messages:", error)
    throw error
  }

  return data as Message[]
}

export async function getActivities(searchQuery?: string) {
  let query = supabase
    .from("activity_logs")
    .select("*, user:users(username, first_name, last_name)")
    .order("created_at", { ascending: false })

  if (searchQuery) {
    query = query.or(`action.ilike.%${searchQuery}%,details.ilike.%${searchQuery}%,telegram_id.ilike.%${searchQuery}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching activities:", error)
    throw error
  }

  return data as Activity[]
}

export async function getStats() {
  try {
    // Get total users
    const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true })

    // Get total messages
    const { count: totalMessages } = await supabase.from("messages").select("*", { count: "exact", head: true })

    // Get active users in the last 24 hours
    const oneDayAgo = new Date()
    oneDayAgo.setDate(oneDayAgo.getDate() - 1)

    const { count: activeUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gt("last_active", oneDayAgo.toISOString())

    // Get conversion count
    const { count: conversionCount } = await supabase
      .from("activity_logs")
      .select("*", { count: "exact", head: true })
      .eq("action", "conversion_completed")

    return {
      totalUsers: totalUsers || 0,
      totalMessages: totalMessages || 0,
      activeUsers: activeUsers || 0,
      conversionCount: conversionCount || 0,
    } as Stats
  } catch (error) {
    console.error("Error fetching stats:", error)
    throw error
  }
}

export async function deleteUser(userId: string) {
  const { error } = await supabase.from("users").delete().eq("id", userId)

  if (error) {
    console.error("Error deleting user:", error)
    throw error
  }

  return true
}

export async function deleteMessage(messageId: string) {
  const { error } = await supabase.from("messages").delete().eq("id", messageId)

  if (error) {
    console.error("Error deleting message:", error)
    throw error
  }

  return true
}

export async function deleteActivity(activityId: string) {
  const { error } = await supabase.from("activity_logs").delete().eq("id", activityId)

  if (error) {
    console.error("Error deleting activity:", error)
    throw error
  }

  return true
}
