import { NextRequest, NextResponse } from 'next/server'
import { SeedDataService } from '@/lib/seed-data'
import { prisma } from '@/lib/prisma'
import { StatusPeminjaman } from '@prisma/client'
import { z } from 'zod'

// Schema untuk validasi request
const DevActionSchema = z.object({
  action: z.enum([
    'seed',
    'clear',
    'reset',
    'status',
    'admin',
    'facilities',
    'users',
    'bookings',
    'notifications'
  ]),
  confirm: z.boolean().optional()
})

// Helper function to check if dev endpoints are allowed
function isDevEndpointAllowed() {
  return process.env.NODE_ENV !== 'production'
}

export async function POST(request: NextRequest) {
  if (!isDevEndpointAllowed()) {
    return NextResponse.json(
      { error: 'Development endpoints are not available in production' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { action, confirm } = DevActionSchema.parse(body)

    // Untuk operasi destructive, butuh konfirmasi
    const destructiveActions = ['clear', 'reset']
    if (destructiveActions.includes(action) && !confirm) {
      return NextResponse.json({
        error: 'Confirmation required for destructive operations',
        message: 'Set confirm: true to proceed'
      }, { status: 400 })
    }

    let result: unknown
    let message: string

    switch (action) {
      case 'seed':
        result = await SeedDataService.seedAll()
        message = 'Database seeded successfully'
        break

      case 'clear':
        result = await SeedDataService.clearAll()
        message = 'Database cleared successfully'
        break

      case 'reset':
        result = await SeedDataService.reset()
        message = 'Database reset successfully'
        break

      case 'status':
        result = await getDatabaseStatus()
        message = 'Database status retrieved'
        break

      case 'admin':
        result = await SeedDataService.createAdminUser()
        message = 'Admin user created successfully'
        break

      case 'facilities':
        result = await SeedDataService.createSampleFacilities()
        message = 'Sample facilities created successfully'
        break

      case 'users':
        result = await SeedDataService.createSampleUsers()
        message = 'Sample users created successfully'
        break

      case 'bookings':
        result = await SeedDataService.createSampleBookings()
        message = 'Sample bookings created successfully'
        break

      case 'notifications':
        result = await SeedDataService.createSampleNotifications()
        message = 'Sample notifications created successfully'
        break

      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Dev API Error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  if (!isDevEndpointAllowed()) {
    return NextResponse.json(
      { error: 'Development endpoints are not available in production' },
      { status: 403 }
    )
  }

  try {
    const status = await getDatabaseStatus()
    
    return NextResponse.json({
      success: true,
      message: 'Development API is active',
      environment: process.env.NODE_ENV,
      database: status,
      endpoints: {
        'POST /api/dev': {
          description: 'Execute development actions',
          actions: [
            'seed - Seed all sample data',
            'clear - Clear all data (requires confirm: true)',
            'reset - Clear and seed data (requires confirm: true)',
            'status - Get database status',
            'admin - Create admin user only',
            'facilities - Create sample facilities only',
            'users - Create sample users only',
            'bookings - Create sample bookings only',
            'notifications - Create sample notifications only'
          ]
        },
        'GET /api/dev': 'Get API status and available endpoints'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Dev API Status Error:', error)
    return NextResponse.json({
      error: 'Failed to get status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function untuk mendapatkan status database
async function getDatabaseStatus() {
  try {
    const [users, facilities, bookings, notifications, auditLogs] = await Promise.all([
      prisma.pengguna.count(),
      prisma.fasilitas.count(),
      prisma.peminjaman.count(),
      prisma.notifikasi.count(),
      prisma.auditLog.count()
    ])

    const adminCount = await prisma.pengguna.count({
      where: { role: 'PETUGAS' }
    })

    const activeBookings = await prisma.peminjaman.count({
      where: {
        status: {
          in: [StatusPeminjaman.DIPROSES, StatusPeminjaman.DISETUJUI]
        }
      }
    })

    return {
      tables: {
        users,
        facilities,
        bookings,
        notifications,
        auditLogs
      },
      summary: {
        adminCount,
        activeBookings,
        totalRecords: users + facilities + bookings + notifications + auditLogs
      },
      isEmpty: users === 0 && facilities === 0 && bookings === 0
    }
  } catch (error) {
    throw new Error(`Failed to get database status: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}