"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, Users, MessageSquare, Activity, LogOut, RefreshCw, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

export default function AdminPage() {
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("password")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    activeUsers: 0,
  })
  const [loadingData, setLoadingData] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageType, setMessageType] = useState<string>("")
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { toast } = useToast()

  // Oturum durumunu kontrol et
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setIsLoggedIn(true)
        fetchData()
      }
    }
    checkSession()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Giriş başarılı",
        description: "Admin paneline yönlendiriliyorsunuz.",
      })

      router.push("/admin/dashboard")
    } catch (error: any) {
      setError(error.message || "Giriş yapılırken bir hata oluştu")
      toast({
        variant: "destructive",
        title: "Giriş başarısız",
        description: error.message || "Giriş yapılırken bir hata oluştu",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
  }

  const fetchData = async () => {
    setLoadingData(true)
    try {
      // Kullanıcıları getir
      let userQuery = supabase.from("users").select("*").order("created_at", { ascending: false })

      if (searchQuery) {
        userQuery = userQuery.or(
          `username.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,telegram_id.ilike.%${searchQuery}%`,
        )
      }

      const { data: usersData } = await userQuery
      setUsers(usersData || [])

      // Mesajları getir
      let messageQuery = supabase
        .from("messages")
        .select("*, user:users(username, first_name, last_name)")
        .order("created_at", { ascending: false })

      if (searchQuery) {
        messageQuery = messageQuery.or(
          `message_text.ilike.%${searchQuery}%,telegram_id.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`,
        )
      }

      if (messageType && messageType !== "all") {
        messageQuery = messageQuery.eq("message_type", messageType)
      }

      const { data: messagesData } = await messageQuery
      setMessages(messagesData || [])

      // Aktiviteleri getir
      let activityQuery = supabase
        .from("activity_logs")
        .select("*, user:users(username, first_name, last_name)")
        .order("created_at", { ascending: false })

      if (searchQuery) {
        activityQuery = activityQuery.or(
          `action.ilike.%${searchQuery}%,details.ilike.%${searchQuery}%,telegram_id.ilike.%${searchQuery}%`,
        )
      }

      const { data: activitiesData } = await activityQuery
      setActivities(activitiesData || [])

      // İstatistikleri hesapla
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      const { count: activeCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gt("last_active", oneDayAgo.toISOString())

      setStats({
        totalUsers: usersData?.length || 0,
        totalMessages: messagesData?.length || 0,
        activeUsers: activeCount || 0,
      })
    } catch (error) {
      console.error("Veri alınırken hata oluştu:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR")
  }

  // Admin kullanıcısı oluştur
  const createAdmin = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: "admin@example.com",
        password: "password",
        options: {
          data: {
            role: "admin",
          },
        },
      })

      if (error) throw error

      toast({
        title: "Admin hesabı oluşturuldu",
        description: "Lütfen e-posta adresinizi kontrol edin ve hesabınızı onaylayın.",
      })

      // Otomatik giriş yapmayı dene
      await supabase.auth.signInWithPassword({
        email: "admin@example.com",
        password: "password",
      })

      router.push("/admin/dashboard")
    } catch (error: any) {
      console.error("Admin oluşturma hatası:", error)
      setError(error.message || "Admin kullanıcısı oluşturulurken bir hata oluştu")

      // Hata admin kullanıcısının zaten var olduğunu söylüyorsa, giriş yapmayı dene
      if (error.message.includes("already exists")) {
        try {
          await supabase.auth.signInWithPassword({
            email: "admin@example.com",
            password: "password",
          })

          toast({
            title: "Giriş başarılı",
            description: "Admin paneline yönlendiriliyorsunuz.",
          })

          router.push("/admin/dashboard")
        } catch (loginError: any) {
          setError(loginError.message || "Giriş yapılırken bir hata oluştu")
          toast({
            variant: "destructive",
            title: "Giriş başarısız",
            description: loginError.message || "Giriş yapılırken bir hata oluştu",
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Admin Paneli</CardTitle>
            <CardDescription>Telegram bot yönetim paneline giriş yapın</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-center mb-2">Henüz admin hesabınız yok mu?</p>
                <Button onClick={createAdmin} variant="outline" className="w-full" disabled={loading}>
                  {loading ? "Oluşturuluyor..." : "Admin Hesabı Oluştur"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Telegram Bot Admin Paneli</h1>
          <Button variant="outline" onClick={handleLogout}>
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
              <div className="text-2xl font-bold">{loadingData ? "..." : stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Kayıtlı toplam kullanıcı sayısı</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Mesaj</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingData ? "..." : stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">İşlenen toplam mesaj sayısı</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Kullanıcılar</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingData ? "..." : stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Son 24 saat içinde aktif kullanıcılar</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="w-full border-b pb-0">
            <TabsTrigger value="users" className="flex-1 rounded-b-none">
              Kullanıcılar
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-1 rounded-b-none">
              Mesajlar
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 rounded-b-none">
              Aktivite Günlüğü
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kullanıcılar</CardTitle>
                <CardDescription>Telegram botunuzu kullanan tüm kullanıcıların listesi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Kullanıcı ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Telegram ID</TableHead>
                        <TableHead>Kullanıcı Adı</TableHead>
                        <TableHead>Ad</TableHead>
                        <TableHead>Soyad</TableHead>
                        <TableHead>Kayıt Tarihi</TableHead>
                        <TableHead>Son Aktif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingData ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            Yükleniyor...
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            {searchQuery ? "Arama sonucu bulunamadı" : "Henüz kullanıcı yok"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.telegram_id}</TableCell>
                            <TableCell>{user.username || "-"}</TableCell>
                            <TableCell>{user.first_name || "-"}</TableCell>
                            <TableCell>{user.last_name || "-"}</TableCell>
                            <TableCell>{formatDate(user.created_at)}</TableCell>
                            <TableCell>{formatDate(user.last_active)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mesajlar</CardTitle>
                <CardDescription>Kullanıcıların botunuza gönderdiği tüm mesajlar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Mesaj ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select value={messageType} onValueChange={setMessageType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tüm mesaj tipleri" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm tipler</SelectItem>
                      <SelectItem value="text">Metin</SelectItem>
                      <SelectItem value="command">Komut</SelectItem>
                      <SelectItem value="callback">Callback</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>Mesaj</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Tarih</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingData ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            Yükleniyor...
                          </TableCell>
                        </TableRow>
                      ) : messages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            {searchQuery || messageType ? "Arama sonucu bulunamadı" : "Henüz mesaj yok"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        messages.map((message) => (
                          <TableRow key={message.id}>
                            <TableCell>
                              {message.user ? (
                                <div>
                                  <div>
                                    {message.user.first_name} {message.user.last_name || ""}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    @{message.user.username || "Bilinmiyor"}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div>@{message.username || "Bilinmiyor"}</div>
                                  <div className="text-xs text-muted-foreground">{message.telegram_id}</div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="max-w-md truncate">{message.message_text}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  message.message_type === "command"
                                    ? "bg-blue-100 text-blue-800"
                                    : message.message_type === "callback"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {message.message_type}
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(message.created_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Aktivite Günlüğü</CardTitle>
                <CardDescription>Kullanıcıların botunuzla etkileşimlerinin detaylı günlüğü</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Aktivite ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>İşlem</TableHead>
                        <TableHead>Detaylar</TableHead>
                        <TableHead>Tarih</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingData ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            Yükleniyor...
                          </TableCell>
                        </TableRow>
                      ) : activities.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            {searchQuery ? "Arama sonucu bulunamadı" : "Henüz aktivite kaydı yok"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        activities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell>
                              {activity.user ? (
                                <div>
                                  <div>
                                    {activity.user.first_name} {activity.user.last_name || ""}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    @{activity.user.username || "Bilinmiyor"}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">{activity.telegram_id}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  activity.action.includes("login")
                                    ? "bg-green-100 text-green-800"
                                    : activity.action.includes("error")
                                      ? "bg-red-100 text-red-800"
                                      : activity.action.includes("payment")
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {activity.action}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-md truncate">{activity.details || "-"}</TableCell>
                            <TableCell>{formatDate(activity.created_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, Users, MessageSquare, Activity, LogOut, RefreshCw, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

export default function AdminPage() {
  const [email, setEmail] = useState("admin@example.com")
  const [password, setPassword] = useState("password")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    activeUsers: 0,
  })
  const [loadingData, setLoadingData] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageType, setMessageType] = useState<string>("")
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { toast } = useToast()

  // Oturum durumunu kontrol et
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setIsLoggedIn(true)
        fetchData()
      }
    }
    checkSession()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Giriş başarılı",
        description: "Admin paneline yönlendiriliyorsunuz.",
      })

      router.push("/admin/dashboard")
    } catch (error: any) {
      setError(error.message || "Giriş yapılırken bir hata oluştu")
      toast({
        variant: "destructive",
        title: "Giriş başarısız",
        description: error.message || "Giriş yapılırken bir hata oluştu",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
  }

  const fetchData = async () => {
    setLoadingData(true)
    try {
      // Kullanıcıları getir
      let userQuery = supabase.from("users").select("*").order("created_at", { ascending: false })

      if (searchQuery) {
        userQuery = userQuery.or(
          `username.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,telegram_id.ilike.%${searchQuery}%`,
        )
      }

      const { data: usersData } = await userQuery
      setUsers(usersData || [])

      // Mesajları getir
      let messageQuery = supabase
        .from("messages")
        .select("*, user:users(username, first_name, last_name)")
        .order("created_at", { ascending: false })

      if (searchQuery) {
        messageQuery = messageQuery.or(
          `message_text.ilike.%${searchQuery}%,telegram_id.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`,
        )
      }

      if (messageType && messageType !== "all") {
        messageQuery = messageQuery.eq("message_type", messageType)
      }

      const { data: messagesData } = await messageQuery
      setMessages(messagesData || [])

      // Aktiviteleri getir
      let activityQuery = supabase
        .from("activity_logs")
        .select("*, user:users(username, first_name, last_name)")
        .order("created_at", { ascending: false })

      if (searchQuery) {
        activityQuery = activityQuery.or(
          `action.ilike.%${searchQuery}%,details.ilike.%${searchQuery}%,telegram_id.ilike.%${searchQuery}%`,
        )
      }

      const { data: activitiesData } = await activityQuery
      setActivities(activitiesData || [])

      // İstatistikleri hesapla
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)

      const { count: activeCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gt("last_active", oneDayAgo.toISOString())

      setStats({
        totalUsers: usersData?.length || 0,
        totalMessages: messagesData?.length || 0,
        activeUsers: activeCount || 0,
      })
    } catch (error) {
      console.error("Veri alınırken hata oluştu:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR")
  }

  // Admin kullanıcısı oluştur
  const createAdmin = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signUp({
        email: "admin@example.com",
        password: "password",
        options: {
          data: {
            role: "admin",
          },
        },
      })

      if (error) throw error

      toast({
        title: "Admin hesabı oluşturuldu",
        description: "Lütfen e-posta adresinizi kontrol edin ve hesabınızı onaylayın.",
      })

      // Otomatik giriş yapmayı dene
      await supabase.auth.signInWithPassword({
        email: "admin@example.com",
        password: "password",
      })

      router.push("/admin/dashboard")
    } catch (error: any) {
      console.error("Admin oluşturma hatası:", error)
      setError(error.message || "Admin kullanıcısı oluşturulurken bir hata oluştu")

      // Hata admin kullanıcısının zaten var olduğunu söylüyorsa, giriş yapmayı dene
      if (error.message.includes("already exists")) {
        try {
          await supabase.auth.signInWithPassword({
            email: "admin@example.com",
            password: "password",
          })

          toast({
            title: "Giriş başarılı",
            description: "Admin paneline yönlendiriliyorsunuz.",
          })

          router.push("/admin/dashboard")
        } catch (loginError: any) {
          setError(loginError.message || "Giriş yapılırken bir hata oluştu")
          toast({
            variant: "destructive",
            title: "Giriş başarısız",
            description: loginError.message || "Giriş yapılırken bir hata oluştu",
          })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Admin Paneli</CardTitle>
            <CardDescription>Telegram bot yönetim paneline giriş yapın</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-center mb-2">Henüz admin hesabınız yok mu?</p>
                <Button onClick={createAdmin} variant="outline" className="w-full" disabled={loading}>
                  {loading ? "Oluşturuluyor..." : "Admin Hesabı Oluştur"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Telegram Bot Admin Paneli</h1>
          <Button variant="outline" onClick={handleLogout}>
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
              <div className="text-2xl font-bold">{loadingData ? "..." : stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Kayıtlı toplam kullanıcı sayısı</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Mesaj</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingData ? "..." : stats.totalMessages}</div>
              <p className="text-xs text-muted-foreground">İşlenen toplam mesaj sayısı</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Kullanıcılar</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loadingData ? "..." : stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Son 24 saat içinde aktif kullanıcılar</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="w-full border-b pb-0">
            <TabsTrigger value="users" className="flex-1 rounded-b-none">
              Kullanıcılar
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-1 rounded-b-none">
              Mesajlar
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 rounded-b-none">
              Aktivite Günlüğü
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kullanıcılar</CardTitle>
                <CardDescription>Telegram botunuzu kullanan tüm kullanıcıların listesi</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Kullanıcı ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Telegram ID</TableHead>
                        <TableHead>Kullanıcı Adı</TableHead>
                        <TableHead>Ad</TableHead>
                        <TableHead>Soyad</TableHead>
                        <TableHead>Kayıt Tarihi</TableHead>
                        <TableHead>Son Aktif</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingData ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            Yükleniyor...
                          </TableCell>
                        </TableRow>
                      ) : users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            {searchQuery ? "Arama sonucu bulunamadı" : "Henüz kullanıcı yok"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.telegram_id}</TableCell>
                            <TableCell>{user.username || "-"}</TableCell>
                            <TableCell>{user.first_name || "-"}</TableCell>
                            <TableCell>{user.last_name || "-"}</TableCell>
                            <TableCell>{formatDate(user.created_at)}</TableCell>
                            <TableCell>{formatDate(user.last_active)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mesajlar</CardTitle>
                <CardDescription>Kullanıcıların botunuza gönderdiği tüm mesajlar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Mesaj ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select value={messageType} onValueChange={setMessageType}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Tüm mesaj tipleri" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm tipler</SelectItem>
                      <SelectItem value="text">Metin</SelectItem>
                      <SelectItem value="command">Komut</SelectItem>
                      <SelectItem value="callback">Callback</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>Mesaj</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Tarih</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingData ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            Yükleniyor...
                          </TableCell>
                        </TableRow>
                      ) : messages.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            {searchQuery || messageType ? "Arama sonucu bulunamadı" : "Henüz mesaj yok"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        messages.map((message) => (
                          <TableRow key={message.id}>
                            <TableCell>
                              {message.user ? (
                                <div>
                                  <div>
                                    {message.user.first_name} {message.user.last_name || ""}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    @{message.user.username || "Bilinmiyor"}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div>@{message.username || "Bilinmiyor"}</div>
                                  <div className="text-xs text-muted-foreground">{message.telegram_id}</div>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="max-w-md truncate">{message.message_text}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  message.message_type === "command"
                                    ? "bg-blue-100 text-blue-800"
                                    : message.message_type === "callback"
                                      ? "bg-purple-100 text-purple-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {message.message_type}
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(message.created_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Aktivite Günlüğü</CardTitle>
                <CardDescription>Kullanıcıların botunuzla etkileşimlerinin detaylı günlüğü</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Aktivite ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button variant="outline" size="icon" onClick={fetchData}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>İşlem</TableHead>
                        <TableHead>Detaylar</TableHead>
                        <TableHead>Tarih</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingData ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            Yükleniyor...
                          </TableCell>
                        </TableRow>
                      ) : activities.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            {searchQuery ? "Arama sonucu bulunamadı" : "Henüz aktivite kaydı yok"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        activities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell>
                              {activity.user ? (
                                <div>
                                  <div>
                                    {activity.user.first_name} {activity.user.last_name || ""}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    @{activity.user.username || "Bilinmiyor"}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">{activity.telegram_id}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  activity.action.includes("login")
                                    ? "bg-green-100 text-green-800"
                                    : activity.action.includes("error")
                                      ? "bg-red-100 text-red-800"
                                      : activity.action.includes("payment")
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {activity.action}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-md truncate">{activity.details || "-"}</TableCell>
                            <TableCell>{formatDate(activity.created_at)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
