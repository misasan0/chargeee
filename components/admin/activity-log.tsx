"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, RefreshCw } from "lucide-react"

type Activity = {
  id: string
  telegram_id: string
  action: string
  details?: string
  created_at: string
  user?: {
    username: string
    first_name: string
    last_name?: string
  }
}

export default function ActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClientComponentClient()

  const fetchActivities = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("activity_logs")
        .select("*, user:users(username, first_name, last_name)")
        .order("created_at", { ascending: false })

      if (searchQuery) {
        query = query.or(
          `action.ilike.%${searchQuery}%,details.ilike.%${searchQuery}%,telegram_id.ilike.%${searchQuery}%`,
        )
      }

      const { data, error } = await query

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error("Aktivite günlüğü alınırken hata oluştu:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [searchQuery])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR")
  }

  return (
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
          <Button variant="outline" size="icon" onClick={fetchActivities}>
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
              {loading ? (
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
                          <div className="text-xs text-muted-foreground">@{activity.user.username || "Bilinmiyor"}</div>
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
  )
}
