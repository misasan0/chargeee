"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Message = {
  id: string
  telegram_id: string
  username?: string
  message_text: string
  message_type: string
  created_at: string
  user?: {
    username: string
    first_name: string
    last_name?: string
  }
}

export default function MessagesList() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [messageType, setMessageType] = useState<string>("")
  const supabase = createClientComponentClient()

  const fetchMessages = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("messages")
        .select("*, user:users(username, first_name, last_name)")
        .order("created_at", { ascending: false })

      if (searchQuery) {
        query = query.or(
          `message_text.ilike.%${searchQuery}%,telegram_id.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`,
        )
      }

      if (messageType) {
        query = query.eq("message_type", messageType)
      }

      const { data, error } = await query

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Mesajlar alınırken hata oluştu:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [searchQuery, messageType])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR")
  }

  return (
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
          <Button variant="outline" size="icon" onClick={fetchMessages}>
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
              {loading ? (
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
                            @{message.user.username || message.username || "Bilinmiyor"}
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
  )
}
