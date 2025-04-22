"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"

export default function DashboardPage() {
  const [users, setUsers] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalMessages: 0,
    activeUsers: 0,
    conversionCount: 0,
  })
  const [loadingData, setLoadingData] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageType, setMessageType] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("users")

  const router = useRouter()
  const supabase = createClientComponentClient()

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

      // Dönüşüm sayısını hesapla
      const { count: conversionCount } = await supabase
        .from("activity_logs")
        .select("*", { count: "exact", head: true })
        .ilike("action", "%conversion%")

      setStats({
        totalUsers: usersData?.length || 0,
        totalMessages: messagesData?.length || 0,
        activeUsers: activeCount || 0,
        conversionCount: conversionCount || 0,
      })
    } catch (error) {
      console.error("Veri alınırken hata oluştu:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await supabase.from("users").delete().eq("id", userId)
      setUsers(users.filter((user) => user.id !== userId))
      alert("Kullanıcı başarıyla silindi.")
    } catch (error) {
      console.error("Kullanıcı silinirken hata:", error)
      alert("Kullanıcı silinirken bir hata oluştu.")
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await supabase.from("messages").delete().eq("id", messageId)
      setMessages(messages.filter((message) => message.id !== messageId))
      alert("Mesaj başarıyla silindi.")
    } catch (error) {
      console.error("Mesaj silinirken hata:", error)
      alert("Mesaj silinirken bir hata oluştu.")
    }
  }

  const handleDeleteActivity = async (activityId: string) => {
    try {
      await supabase.from("activity_logs").delete().eq("id", activityId)
      setActivities(activities.filter((activity) => activity.id !== activityId))
      alert("Aktivite başarıyla silindi.")
    } catch (error) {
      console.error("Aktivite silinirken hata:", error)
      alert("Aktivite silinirken bir hata oluştu.")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR")
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-10 bg-white shadow">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Telegram Bot Admin Paneli</h1>
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Çıkış Yap
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-blue-500 p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    ></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">Toplam Kullanıcı</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {loadingData ? "..." : stats.totalUsers}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-green-500 p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    ></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">Toplam Mesaj</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {loadingData ? "..." : stats.totalMessages}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-purple-500 p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">Aktif Kullanıcılar</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {loadingData ? "..." : stats.activeUsers}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 rounded-md bg-yellow-500 p-3">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    ></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">Dönüşüm Sayısı</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {loadingData ? "..." : stats.conversionCount}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg bg-white shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("users")}
                className={`w-1/3 border-b-2 py-4 px-1 text-center text-sm font-medium ${
                  activeTab === "users"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Kullanıcılar
              </button>
              <button
                onClick={() => setActiveTab("messages")}
                className={`w-1/3 border-b-2 py-4 px-1 text-center text-sm font-medium ${
                  activeTab === "messages"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Mesajlar
              </button>
              <button
                onClick={() => setActiveTab("activity")}
                className={`w-1/3 border-b-2 py-4 px-1 text-center text-sm font-medium ${
                  activeTab === "activity"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                Aktivite Günlüğü
              </button>
            </nav>
          </div>

          <div className="p-4">
            <div className="mb-4 flex items-center space-x-2">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder={
                    activeTab === "users"
                      ? "Kullanıcı ara..."
                      : activeTab === "messages"
                        ? "Mesaj ara..."
                        : "Aktivite ara..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {activeTab === "messages" && (
                <select
                  className="rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                >
                  <option value="all">Tüm tipler</option>
                  <option value="text">Metin</option>
                  <option value="command">Komut</option>
                  <option value="callback">Callback</option>
                </select>
              )}

              <button
                onClick={fetchData}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg
                  className={`-ml-1 mr-2 h-5 w-5 ${loadingData ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
                Yenile
              </button>
            </div>

            {activeTab === "users" && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Telegram ID
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Kullanıcı Adı
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Ad
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Soyad
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Kayıt Tarihi
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Son Aktif
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">İşlemler</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loadingData ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center">
                          Yükleniyor...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center">
                          {searchQuery ? "Arama sonucu bulunamadı" : "Henüz kullanıcı yok"}
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{user.telegram_id}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{user.username || "-"}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{user.first_name || "-"}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{user.last_name || "-"}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {formatDate(user.last_active)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                if (confirm("Bu kullanıcıyı silmek istediğinizden emin misiniz?")) {
                                  handleDeleteUser(user.id)
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "messages" && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Kullanıcı
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Mesaj
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Tip
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Tarih
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">İşlemler</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loadingData ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center">
                          Yükleniyor...
                        </td>
                      </tr>
                    ) : messages.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center">
                          {searchQuery || messageType !== "all" ? "Arama sonucu bulunamadı" : "Henüz mesaj yok"}
                        </td>
                      </tr>
                    ) : (
                      messages.map((message) => (
                        <tr key={message.id}>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {message.user ? (
                              <div>
                                <div>
                                  {message.user.first_name} {message.user.last_name || ""}
                                </div>
                                <div className="text-xs text-gray-400">@{message.user.username || "Bilinmiyor"}</div>
                              </div>
                            ) : (
                              <div>
                                <div>@{message.username || "Bilinmiyor"}</div>
                                <div className="text-xs text-gray-400">{message.telegram_id}</div>
                              </div>
                            )}
                          </td>
                          <td className="max-w-md truncate px-6 py-4 text-sm text-gray-500">{message.message_text}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                message.message_type === "command"
                                  ? "bg-blue-100 text-blue-800"
                                  : message.message_type === "callback"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {message.message_type}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {formatDate(message.created_at)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                if (confirm("Bu mesajı silmek istediğinizden emin misiniz?")) {
                                  handleDeleteMessage(message.id)
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "activity" && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Kullanıcı
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        İşlem
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Detaylar
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                      >
                        Tarih
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">İşlemler</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {loadingData ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center">
                          Yükleniyor...
                        </td>
                      </tr>
                    ) : activities.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center">
                          {searchQuery ? "Arama sonucu bulunamadı" : "Henüz aktivite kaydı yok"}
                        </td>
                      </tr>
                    ) : (
                      activities.map((activity) => (
                        <tr key={activity.id}>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {activity.user ? (
                              <div>
                                <div>
                                  {activity.user.first_name} {activity.user.last_name || ""}
                                </div>
                                <div className="text-xs text-gray-400">@{activity.user.username || "Bilinmiyor"}</div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400">{activity.telegram_id}</div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
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
                          </td>
                          <td className="max-w-md truncate px-6 py-4 text-sm text-gray-500">{activity.details || "-"}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {formatDate(activity.created_at)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                if (confirm("Bu aktiviteyi silmek istediğinizden emin misiniz?")) {
                                  handleDeleteActivity(activity.id)
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
