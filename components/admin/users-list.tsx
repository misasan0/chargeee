"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, RefreshCw } from "lucide-react"

type User = {
  id: string
  telegram_id: string
  username: string
  first_name: string
  last_name?: string
  created_at: string
  last_active: string
}

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClientComponentClient()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      let query = supabase.from("users").select("*").order("created_at", { ascending: false })

      if (searchQuery) {
        query = query.or(
          `username.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,telegram_id.ilike.%${searchQuery}%`,
        )
      }

      const { data, error } = await query

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Kullanıcılar alınırken hata oluştu:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [searchQuery])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR")
  }

  return (
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
          <Button variant="outline" size="icon" onClick={fetchUsers}>
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
              {loading ? (
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
  )
}
