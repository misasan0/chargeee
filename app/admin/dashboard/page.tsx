"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Users, MessageSquare, Activity } from "lucide-react"
import UsersList from "@/components/admin/users-list"
import MessagesList from "@/components/admin/messages-list"
import ActivityLog from "@/components/admin/activity-log"

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    activeUsers: 0,
  })
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Kullanıcı sayısını al
        const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true })

        // Mesaj sayısını al
        const { count: messageCount } = await supabase.from("messages").select("*", { count: "exact", head: true })

        // Aktif kullanıcı sayısını al (son 24 saat içinde)
        const oneDayAgo = new Date()
        oneDayAgo.setDate(oneDayAgo.getDate() - 1)

        const { count: activeCount } = await supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .gt("last_active", oneDayAgo.toISOString())

        setStats({
          totalUsers: userCount || 0,
          totalMessages: messageCount || 0,
          activeUsers: activeCount || 0,
        })
      } catch (error) {
        console.error("İstatistikler alınırken hata oluştu:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Telegram Bot Admin Paneli</h1>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Çıkış Yap
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Kayıtlı toplam kullanıcı sayısı</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Mesaj</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">İşlenen toplam mesaj sayısı</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Kullanıcılar</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Son 24 saat içinde aktif kullanıcılar</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="messages">Mesajlar</TabsTrigger>
            <TabsTrigger value="activity">Aktivite Günlüğü</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="space-y-4">
            <UsersList />
          </TabsContent>
          <TabsContent value="messages" className="space-y-4">
            <MessagesList />
          </TabsContent>
          <TabsContent value="activity" className="space-y-4">
            <ActivityLog />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
