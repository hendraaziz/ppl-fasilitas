import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { Role, TipePengguna } from "@prisma/client"

// Generate OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Check if email is UGM student email
export function isUGMEmail(email: string): boolean {
  return email.endsWith('@mail.ugm.ac.id') || email.endsWith('@ugm.ac.id')
}

// Verify OTP for external users
export async function verifyOTP(email: string, otp: string) {
  try {
    const user = await prisma.pengguna.findUnique({
      where: { email }
    })

    if (!user || !user.otpCode || !user.otpExpiry) {
      return null
    }

    // Check if OTP is expired (compare with WIB timezone)
    const now = new Date()
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)) // Add 7 hours for WIB
    
    if (wibTime > user.otpExpiry) {
      // Clear expired OTP
      await prisma.pengguna.update({
        where: { email },
        data: {
          otpCode: null,
          otpExpiry: null
        }
      })
      return null
    }

    // Verify OTP
    if (user.otpCode === otp) {
      // Clear OTP after successful verification
      await prisma.pengguna.update({
        where: { email },
        data: {
          otpCode: null,
          otpExpiry: null
        }
      })
      return user
    }

    return null
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return null
  }
}

// Create or update user for Google SSO
export async function createOrUpdateGoogleUser(email: string, name: string, googleId: string) {
  return await prisma.pengguna.upsert({
    where: { email },
    update: {
      nama: name,
      googleId: googleId
    },
    create: {
      email,
      nama: name,
      role: Role.MAHASISWA,
      tipePengguna: TipePengguna.MAHASISWA,
      googleId: googleId
    }
  })
}

// Create or update external user with OTP
export async function createOrUpdateExternalUser(email: string, otp: string) {
  // Create expiry time in Indonesia timezone (WIB = UTC+7)
  const now = new Date()
  const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)) // Add 7 hours for WIB
  const expiryTime = new Date(wibTime.getTime() + (10 * 60 * 1000)) // Add 10 minutes
  
  return await prisma.pengguna.upsert({
    where: { email },
    update: {
      otpCode: otp,
      otpExpiry: expiryTime
    },
    create: {
      email,
      nama: email.split('@')[0], // Temporary name
      role: Role.EKSTERNAL,
      tipePengguna: TipePengguna.EKSTERNAL,
      otpCode: otp,
      otpExpiry: expiryTime
    }
  })
}

// Authenticate user with credentials
export async function authenticateUser(email: string, password: string) {
  const user = await prisma.pengguna.findUnique({
    where: { email }
  })

  if (!user || !user.password) {
    return null
  }

  // Only allow PETUGAS to login with credentials
  if (user.role !== Role.PETUGAS) {
    return null
  }

  const isPasswordValid = await verifyPassword(password, user.password)
  
  if (!isPasswordValid) {
    return null
  }

  return user
}