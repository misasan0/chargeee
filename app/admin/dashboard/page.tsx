"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  getUsers,
  getMessages,
  getActivities,
  getStats,
  deleteUser,
  deleteMessage,
  deleteActivity,
} from "@/lib/supabase-admin"
import type { User, Message, Activity, Stats } from "@/types/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  MessageSquare,
  ActivityIcon,
  LogOut,
  RefreshCw,
  Search,
  Trash2,
  Repeat,
  UserCheck,
  Loader2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalMessages: 0,
    activeUsers: 0,
    conversionCount: 0,
  })
  const [loadingData, setLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageType, setMessageType] = useState<string>("all")
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    checkSession()
    fetchData()
  }, [])

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      router.push("/admin")
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/admin")
  }

  const fetchData = async () => {
    setLoadingData(true)
    try {
      const [usersData, messagesData, activitiesData, statsData] = await Promise.all([
        getUsers(searchQuery),
        getMessages(searchQuery, messageType),
        getActivities(searchQuery),
        getStats(),
      ])

      setUsers(usersData)
      setMessages(messagesData)
      setActivities(activitiesData)
      setStats(statsData)

      toast({
        title: "Veriler güncellendi",
        description: "Tüm veriler başarıyla yüklendi.",
      })
    } catch (error) {
      console.error("Veri alınırken hata oluştu:", error)
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Veriler alınırken bir hata oluştu.",
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setDeleteLoading(userId)
    try {
      await deleteUser(userId)
      setUsers(users.filter((user) => user.id !== userId))
      toast({
        title: "Kullanıcı silindi",
        description: "Kullanıcı başarıyla silindi.",
      })
    } catch (error) {
      console.error("Kullanıcı silinirken hata:", error)
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Kullanıcı silinirken bir hata oluştu.",
      })
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    setDeleteLoading(messageId)
    try {
      await deleteMessage(messageId)
      setMessages(messages.filter((message) => message.id !== messageId))
      toast({
        title: "Mesaj silindi",
        description: "Mesaj başarıyla silindi.",
      })
    } catch (error) {
      console.error("Mesaj silinirken hata:", error)
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Mesaj silinirken bir hata oluştu.",
      })
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    setDeleteLoading(activityId)
    try {
      await deleteActivity(activityId)
      setActivities(activities.filter((activity) => activity.id !== activityId))
      toast({
        title: "Aktivite silindi",
        description: "Aktivite başarıyla silindi.",
      })
    } catch (error) {
      console.error("Aktivite silinirken hata:", error)
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Aktivite silinirken bir hata oluştu.",
      })
    } finally {
      setDeleteLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <h1 className="text-2xl font-bold">Telegram Bot Admin Paneli</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Çıkış Yap
          </Button>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Kayıtlı toplam kullanıcı sayısı</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Mesaj</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalMessages}</div>
                  <p className="text-xs text-muted-foreground">İşlenen toplam mesaj sayısı</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Kullanıcılar</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">Son 24 saat içinde aktif kullanıcılar</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dönüşüm Sayısı</CardTitle>
              <Repeat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.conversionCount}</div>
                  <p className="text-xs text-muted-foreground">Toplam para dönüşümü sayısı</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">
                <Users className="mr-2 h-4 w-4" />
                Kullanıcılar
              </TabsTrigger>
              <TabsTrigger value="messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                Mesajlar
              </TabsTrigger>
              <TabsTrigger value="activity">
                <ActivityIcon className="mr-2 h-4 w-4" />
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
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={loadingData}>
                      <RefreshCw className={`h-4 w-4 ${loadingData ? "animate-spin" : ""}`} />
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
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingData ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                              <TableCell colSpan={7}>
                                <Skeleton className="h-10 w-full" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4">
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
                              <TableCell className="text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                    >
                                      {deleteLoading === user.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>İptal</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Sil
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
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
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={loadingData}>
                      <RefreshCw className={`h-4 w-4 ${loadingData ? "animate-spin" : ""}`} />
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
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingData ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                              <TableCell colSpan={5}>
                                <Skeleton className="h-10 w-full" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : messages.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
                              {searchQuery || messageType !== "all" ? "Arama sonucu bulunamadı" : "Henüz mesaj yok"}
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
                                <Badge
                                  variant={
                                    message.message_type === "command"
                                      ? "default"
                                      : message.message_type === "callback"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {message.message_type}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatDate(message.created_at)}</TableCell>
                              <TableCell className="text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                    >
                                      {deleteLoading === message.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Mesajı Sil</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bu mesajı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>İptal</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Sil
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
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
                      />{" "}
                      => setSearchQuery(e.target.value)} className="pl-8" />
                    </div>
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={loadingData}>
                      <RefreshCw className={`h-4 w-4 ${loadingData ? "animate-spin" : ""}`} />
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
                          <TableHead className="text-right">İşlemler</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingData ? (
                          Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                              <TableCell colSpan={5}>
                                <Skeleton className="h-10 w-full" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : activities.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4">
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
                                <Badge
                                  variant={
                                    activity.action.includes("conversion")
                                      ? "default"
                                      : activity.action.includes("menu")
                                        ? "secondary"
                                        : activity.action.includes("error")
                                          ? "destructive"
                                          : "outline"
                                  }
                                >
                                  {activity.action}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-md truncate">{activity.details || "-"}</TableCell>
                              <TableCell>{formatDate(activity.created_at)}</TableCell>
                              <TableCell className="text-right">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                    >
                                      {deleteLoading === activity.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Aktiviteyi Sil</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bu aktiviteyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>İptal</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteActivity(activity.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Sil
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
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
        </div>
      </main>
    </div>
  )
}
