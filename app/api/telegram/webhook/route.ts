import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Supabase istemcisini oluştur
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// Telegram bot token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ""

// Telegram API URL
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`

export async function POST(request: Request) {
  try {
    const update = await request.json()
    console.log("Telegram update:", JSON.stringify(update))

    // Mesaj varsa işle
    if (update.message) {
      const { message } = update
      const chatId = message.chat.id
      const text = message.text || ""
      const username = message.from.username || ""
      const firstName = message.from.first_name || ""
      const lastName = message.from.last_name || ""
      const telegramId = message.from.id.toString()

      console.log(`Kullanıcı bilgileri: ID=${telegramId}, Username=${username}, Name=${firstName} ${lastName}`)

      // Kullanıcıyı veritabanına kaydet veya güncelle
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("*")
        .eq("telegram_id", telegramId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Kullanıcı kontrol edilirken hata:", checkError)
      }

      if (!existingUser) {
        console.log(`Yeni kullanıcı ekleniyor: ${telegramId}`)
        const { error: insertError } = await supabase.from("users").insert({
          telegram_id: telegramId,
          username,
          first_name: firstName,
          last_name: lastName,
          last_active: new Date().toISOString(),
        })

        if (insertError) {
          console.error("Kullanıcı eklenirken hata:", insertError)
        } else {
          console.log(`Kullanıcı başarıyla eklendi: ${telegramId}`)
        }
      } else {
        console.log(`Mevcut kullanıcı güncelleniyor: ${telegramId}`)
        const { error: updateError } = await supabase
          .from("users")
          .update({
            username,
            first_name: firstName,
            last_name: lastName,
            last_active: new Date().toISOString(),
          })
          .eq("telegram_id", telegramId)

        if (updateError) {
          console.error("Kullanıcı güncellenirken hata:", updateError)
        } else {
          console.log(`Kullanıcı başarıyla güncellendi: ${telegramId}`)
        }
      }

      // Mesajı veritabanına kaydet
      const messageType = text.startsWith("/") ? "command" : "text"
      const { error: messageError } = await supabase.from("messages").insert({
        telegram_id: telegramId,
        username,
        message_text: text,
        message_type: messageType,
      })

      if (messageError) {
        console.error("Mesaj kaydedilirken hata:", messageError)
      } else {
        console.log(`Mesaj başarıyla kaydedildi: ${text}`)
      }

      // Aktivite günlüğüne kaydet
      const { error: activityError } = await supabase.from("activity_logs").insert({
        telegram_id: telegramId,
        action: "message_received",
        details: `Mesaj: ${text}`,
      })

      if (activityError) {
        console.error("Aktivite kaydedilirken hata:", activityError)
      } else {
        console.log(`Aktivite başarıyla kaydedildi: message_received`)
      }

      // Komutları işle
      if (text.startsWith("/")) {
        if (text === "/start") {
          await sendMessage(
            chatId,
            `Merhaba ${firstName}! SafeMoneyRobot'a hoş geldiniz. Kripto para fiyatlarını görmek için bir kripto para birimi adı yazabilirsiniz.`,
          )
        } else if (text === "/help") {
          await sendMessage(
            chatId,
            "Kripto para fiyatlarını görmek için bir kripto para birimi adı yazabilirsiniz. Örneğin: BTC, ETH, XRP, vb.",
          )
        } else {
          await sendMessage(chatId, "Bilinmeyen komut. Yardım için /help yazabilirsiniz.")
        }
      } else {
        // Normal mesajları işle (örneğin kripto para birimi adı)
        const cryptoName = text.toUpperCase().trim()
        if (cryptoName) {
          try {
            // Burada gerçek bir API'den kripto para fiyatını alabilirsiniz
            // Örnek olarak sabit bir yanıt döndürüyoruz
            await sendMessage(
              chatId,
              `${cryptoName} fiyatı: ${Math.floor(Math.random() * 10000) / 100} USD\n\nBu örnek bir yanıttır. Gerçek bir API entegrasyonu için kodu güncelle  * 10000) / 100} USD\n\nBu örnek bir yanıttır. Gerçek bir API entegrasyonu için kodu güncelleyin.`,
            )
          } catch (error) {
            console.error("Kripto fiyatı alınırken hata:", error)
            await sendMessage(chatId, "Kripto para fiyatı alınırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.")
          }
        }
      }
    } else if (update.callback_query) {
      // Callback query işleme (buton tıklamaları vb.)
      const { callback_query } = update
      const chatId = callback_query.message.chat.id
      const data = callback_query.data
      const telegramId = callback_query.from.id.toString()
      const username = callback_query.from.username || ""

      // Callback verisini veritabanına kaydet
      const { error: messageError } = await supabase.from("messages").insert({
        telegram_id: telegramId,
        username,
        message_text: data,
        message_type: "callback",
      })

      if (messageError) {
        console.error("Callback kaydedilirken hata:", messageError)
      }

      // Aktivite günlüğüne kaydet
      await supabase.from("activity_logs").insert({
        telegram_id: telegramId,
        action: "callback_received",
        details: `Callback: ${data}`,
      })

      // Callback verilerine göre işlem yap
      await sendMessage(chatId, `Seçiminiz: ${data}`)
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("Webhook işlenirken hata:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Telegram'a mesaj gönderme yardımcı fonksiyonu
async function sendMessage(chatId: number, text: string) {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Mesaj gönderilirken hata:", error)
    throw error
  }
}

// GET isteği için basit bir yanıt
export async function GET() {
  return NextResponse.json({ message: "Telegram Webhook API endpoint is working" })
}
