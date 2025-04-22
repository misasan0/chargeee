export interface User {
  id: string
  telegram_id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  created_at: string
  last_active: string
}

export interface Message {
  id: string
  telegram_id: string
  username: string | null
  message_text: string
  message_type: "text" | "command" | "callback"
  created_at: string
  user?: User
}

export interface Activity {
  id: string
  telegram_id: string
  action: string
  details: string
  created_at: string
  user?: User
}

export interface Stats {
  totalUsers: number
  totalMessages: number
  activeUsers: number
  conversionCount: number
}

export interface AdminUser {
  id: string
  email: string
  role: string
  created_at: string
}
