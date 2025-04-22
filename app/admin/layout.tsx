import type React from "react"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // URL'yi kontrol et
  const requestUrl = cookies().get("next-url")?.value || ""
  const isLoginPage = requestUrl.includes("/admin/login") || requestUrl.includes("/admin/create-admin")

  // Login sayfasında değilsek ve oturum yoksa login sayfasına yönlendir
  if (!session && !isLoginPage) {
    redirect("/admin/login")
  }

  // Oturum varsa ve login sayfasındaysak dashboard'a yönlendir
  if (session && isLoginPage) {
    redirect("/admin/dashboard")
  }

  return <div>{children}</div>
}
