import { NextRequest, NextResponse } from "next/server"
import { verifyOTP } from "@/lib/auth"
import { z } from "zod"
import { SignJWT } from "jose"

const verifyOTPSchema = z.object({
  email: z.string().email("Email tidak valid"),
  otp: z.string().length(6, "Kode OTP harus 6 digit")
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const { email, otp } = verifyOTPSchema.parse(body)
    
    // Verify OTP
    const user = await verifyOTP(email, otp)
    
    if (!user) {
      return NextResponse.json(
        { error: "Kode OTP tidak valid atau sudah kedaluwarsa" },
        { status: 400 }
      )
    }
    
    // Create JWT token for external user session
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tipePengguna: user.tipePengguna
    }
    
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret)
    
    const response = NextResponse.json(
      {
        success: true,
        message: "Login berhasil",
        user: {
          id: user.id,
          email: user.email,
          nama: user.nama,
          role: user.role,
          tipePengguna: user.tipePengguna
        },
        token
      },
      { status: 200 }
    )

    // Set cookie for external token
    response.cookies.set('external_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }
    
    console.error("Error in verify-otp:", error)
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}