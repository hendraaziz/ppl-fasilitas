import nodemailer from "nodemailer"
import { generateOTP, createOrUpdateExternalUser } from "./auth"
import { NotificationHelper } from './business-logic'
import { JenisNotifikasi } from '@prisma/client'

// Create email transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  })
}

// Send OTP email to external user
export async function sendOTPEmail(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const otp = generateOTP()
    
    // Store OTP in database
    await createOrUpdateExternalUser(email, otp)
    
    // Create transporter
    const transporter = createTransporter()
    
    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Kode OTP Login - ${process.env.APP_NAME}`,
      text: `Kode OTP Anda: ${otp}\n\nKode ini berlaku selama 10 menit.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">${process.env.APP_NAME}</h1>
            <h2 style="color: #666; font-weight: normal;">Kode OTP Login</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Kode OTP Anda untuk login ke sistem peminjaman fasilitas:</p>
            
            <div style="background: #fff; border: 2px solid #007bff; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #007bff; border-radius: 8px; letter-spacing: 4px; margin: 20px 0;">
              ${otp}
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">⏰ Kode ini berlaku selama <strong>10 menit</strong></p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px;">
            <p style="color: #999; font-size: 12px; margin: 0;">Jika Anda tidak meminta kode ini, abaikan email ini.</p>
            <p style="color: #999; font-size: 12px; margin: 5px 0 0 0;">Email ini dikirim secara otomatis, mohon tidak membalas.</p>
          </div>
        </div>
      `
    })
    
    return {
      success: true,
      message: "Kode OTP berhasil dikirim ke email Anda"
    }
  } catch (error) {
    console.error("Error sending OTP email:", error)
    return {
      success: false,
      message: "Gagal mengirim kode OTP. Silakan coba lagi."
    }
  }
}

// Send notification email
export async function sendNotificationEmail(
  to: string,
  subject: string,
  message: string
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransporter()
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject: `${subject} - ${process.env.APP_NAME}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">${process.env.APP_NAME}</h1>
            <h2 style="color: #666; font-weight: normal;">${subject}</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <div style="color: #333; font-size: 16px; line-height: 1.6;">
              ${message.replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px;">
            <p style="color: #999; font-size: 12px; margin: 0;">Email ini dikirim secara otomatis dari sistem peminjaman fasilitas.</p>
          </div>
        </div>
      `
    })
    
    return {
      success: true,
      message: "Email notifikasi berhasil dikirim"
    }
  } catch (error) {
    console.error("Error sending notification email:", error)
    return {
      success: false,
      message: "Gagal mengirim email notifikasi"
    }
  }
}

// Send booking status notification
export async function sendBookingStatusEmail(
  email: string,
  userId: string,
  type: 'approved' | 'rejected' | 'revision',
  bookingDetails: { fasilitas: string; tanggalMulai: string; tanggalSelesai: string; tujuan: string },
  additionalInfo?: string
): Promise<{ success: boolean; message: string }> {
  try {
    let subject: string
    let message: string
    let jenisNotifikasi: JenisNotifikasi

    switch (type) {
      case 'approved':
        subject = 'Peminjaman Fasilitas Disetujui'
        message = `Selamat! Peminjaman fasilitas ${bookingDetails.fasilitas} Anda telah disetujui.\n\nDetail Peminjaman:\n- Fasilitas: ${bookingDetails.fasilitas}\n- Tanggal: ${bookingDetails.tanggalMulai} - ${bookingDetails.tanggalSelesai}\n- Tujuan: ${bookingDetails.tujuan}\n\nSilakan login ke sistem untuk melihat detail lengkap dan mengunduh SIP (Surat Izin Peminjaman).`
        jenisNotifikasi = 'DISETUJUI'
        break
      case 'rejected':
        subject = 'Peminjaman Fasilitas Ditolak'
        message = `Mohon maaf, peminjaman fasilitas ${bookingDetails.fasilitas} Anda tidak dapat disetujui.\n\nDetail Peminjaman:\n- Fasilitas: ${bookingDetails.fasilitas}\n- Tanggal: ${bookingDetails.tanggalMulai} - ${bookingDetails.tanggalSelesai}\n- Tujuan: ${bookingDetails.tujuan}${additionalInfo ? `\n- Alasan: ${additionalInfo}` : ''}\n\nAnda dapat mengajukan peminjaman baru dengan memperbaiki hal-hal yang menjadi alasan penolakan.`
        jenisNotifikasi = 'DITOLAK'
        break
      case 'revision':
        subject = 'Peminjaman Fasilitas Perlu Revisi'
        message = `Peminjaman fasilitas ${bookingDetails.fasilitas} Anda memerlukan revisi sebelum dapat disetujui.\n\nDetail Peminjaman:\n- Fasilitas: ${bookingDetails.fasilitas}\n- Tanggal: ${bookingDetails.tanggalMulai} - ${bookingDetails.tanggalSelesai}\n- Tujuan: ${bookingDetails.tujuan}${additionalInfo ? `\n- Catatan Revisi: ${additionalInfo}` : ''}\n\nSilakan login ke sistem untuk melakukan revisi pada peminjaman Anda.`
        jenisNotifikasi = 'REVISI'
        break
    }

    // Send email notification
    const emailResult = await sendNotificationEmail(email, subject, message)
    
    if (emailResult.success) {
      // Create in-app notification
      await NotificationHelper.createNotification(
        userId,
        jenisNotifikasi,
        subject,
        message.replace(/\\n/g, ' '),
        email
      )
    }

    return emailResult
  } catch (error) {
    console.error('Error sending booking status email:', error)
    return {
      success: false,
      message: 'Gagal mengirim notifikasi status peminjaman'
    }
  }
}

// Send payment confirmation email
export async function sendPaymentConfirmationEmail(
  email: string,
  userId: string,
  bookingDetails: { fasilitas: string; tanggalMulai: string; tanggalSelesai: string },
  amount: number
): Promise<{ success: boolean; message: string }> {
  try {
    const subject = 'Pembayaran Dikonfirmasi'
    const message = `Pembayaran untuk peminjaman fasilitas ${bookingDetails.fasilitas} Anda telah dikonfirmasi.\n\nDetail Pembayaran:\n- Fasilitas: ${bookingDetails.fasilitas}\n- Tanggal: ${bookingDetails.tanggalMulai} - ${bookingDetails.tanggalSelesai}\n- Jumlah: Rp ${amount.toLocaleString('id-ID')}\n\nTerima kasih atas pembayaran Anda. Peminjaman fasilitas sudah dapat digunakan sesuai jadwal.`
    
    // Send email notification
    const emailResult = await sendNotificationEmail(email, subject, message)
    
    if (emailResult.success) {
      // Create in-app notification
      await NotificationHelper.createNotification(
        userId,
        'PEMBAYARAN',
        subject,
        `Pembayaran untuk peminjaman fasilitas ${bookingDetails.fasilitas} telah dikonfirmasi.`,
        email
      )
    }

    return emailResult
  } catch (error) {
    console.error('Error sending payment confirmation email:', error)
    return {
      success: false,
      message: 'Gagal mengirim konfirmasi pembayaran'
    }
  }
}

// Test email connection
export async function testEmailConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    return {
      success: true,
      message: 'Koneksi email berhasil'
    }
  } catch (error) {
    console.error('Email connection test failed:', error)
    return {
      success: false,
      message: 'Koneksi email gagal'
    }
  }
}