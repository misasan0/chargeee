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

  // Login sayfasında değilsek ve oturum yoksa login sayfasına yönlendir
  if (!session && !cookies().get("next-url")?.value?.includes("/admin/login")) {
    redirect("/admin/login")
  }

  return <div>{children}</div>
}
