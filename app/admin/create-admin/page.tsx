"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function CreateAdminPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const createAdmin = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { data, error } = await supabase.functions.invoke("create-admin", {
        body: {
          email: "nikelbaba@admin.com",
          password: "nikel123",
        },
      })

      if (error) throw error

      setSuccess(true)
    } catch (error: any) {
      console.error("Admin oluşturma hatası:", error)
      setError(error.message || "Admin kullanıcısı oluşturulurken bir hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Kullanıcısı Oluştur</CardTitle>
          <CardDescription>Yeni bir admin kullanıcısı oluşturmak için butona tıklayın</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                Admin kullanıcısı başarıyla oluşturuldu:
                <div className="mt-2 text-sm">
                  <div>Email: nikelbaba@admin.com</div>
                  <div>Şifre: nikel123</div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="pt-4">
            <Button onClick={createAdmin} disabled={loading} className="w-full">
              {loading ? "Oluşturuluyor..." : "Admin Kullanıcısı Oluştur"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
