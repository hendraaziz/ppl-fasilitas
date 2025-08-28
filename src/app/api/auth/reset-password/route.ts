import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'

// Generate random password
function generateRandomPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

// Configure nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD
  }
})

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find admin user
    const user = await prisma.pengguna.findUnique({
      where: { 
        email,
        role: 'PETUGAS' // Only allow reset for admin/petugas
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      )
    }

    // Generate new password
    const newPassword = generateRandomPassword()
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    // Update password in database
    await prisma.pengguna.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    // Send email with new password
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Reset Password - Sistem Booking Fasilitas',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Reset Password Berhasil</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Halo <strong>${user.nama}</strong>,</p>
            <p>Password Anda telah berhasil direset. Berikut adalah password baru Anda:</p>
            <div style="background-color: #fff; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0;">
              <strong style="font-size: 18px; color: #007bff;">${newPassword}</strong>
            </div>
            <p><strong>Penting:</strong></p>
            <ul>
              <li>Segera login dan ubah password ini dengan password yang lebih mudah diingat</li>
              <li>Jangan bagikan password ini kepada siapapun</li>
              <li>Simpan password ini di tempat yang aman</li>
            </ul>
            <p>Jika Anda tidak meminta reset password, segera hubungi administrator sistem.</p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
          </div>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({
      message: 'Password berhasil direset dan dikirim ke email',
      success: true
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}