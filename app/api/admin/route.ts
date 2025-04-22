import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
  }

  // Burada admin paneli için gerekli verileri döndürebilirsiniz
  return NextResponse.json({
    status: "success",
    message: "Admin API çalışıyor",
  })
}
