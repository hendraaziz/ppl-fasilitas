import { NextRequest, NextResponse } from "next/server"
import { sendOTPEmail } from "@/lib/email"
import { z } from "zod"

const sendOTPSchema = z.object({
  email: z.string().email("Email tidak valid")
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const { email } = sendOTPSchema.parse(body)
    
    // Check if email is not UGM email (external users only)
    if (email.endsWith('@mail.ugm.ac.id') || email.endsWith('@ugm.ac.id')) {
      return NextResponse.json(
        { error: "Email UGM harus menggunakan SSO Google" },
        { status: 400 }
      )
    }
    
    // Send OTP email
    const result = await sendOTPEmail(email)
    
    if (result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { error: result.message },
        { status: 500 }
      )
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error("Error in send-otp:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}