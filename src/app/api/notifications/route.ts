import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { JenisNotifikasi } from '@prisma/client'

// Validation schema
const notificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  jenis: z.nativeEnum(JenisNotifikasi),
  judul: z.string().min(1, 'Judul is required').max(255),
  pesan: z.string().min(1, 'Pesan is required'),
  tujuan: z.string().email('Invalid email format')
})

// GET /api/notifications - Get notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const jenis = searchParams.get('jenis') as JenisNotifikasi | null

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = {
      userId
    }

    if (unreadOnly) {
      where.statusDibaca = false
    }

    if (jenis) {
      where.jenis = jenis
    }

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.notifikasi.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.notifikasi.count({ where })
    ])

    // Get unread count
    const unreadCount = await prisma.notifikasi.count({
      where: {
        userId,
        statusDibaca: false
      }
    })

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validatedData = notificationSchema.parse(body)

    // Check if user exists
    const user = await prisma.pengguna.findUnique({
      where: { id: validatedData.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create notification
    const notification = await prisma.notifikasi.create({
      data: validatedData
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications - Mark all notifications as read for a user
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (action === 'markAllRead') {
      // Mark all notifications as read
      const result = await prisma.notifikasi.updateMany({
        where: {
          userId,
          statusDibaca: false
        },
        data: {
          statusDibaca: true
        }
      })

      return NextResponse.json({
        message: 'All notifications marked as read',
        updatedCount: result.count
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}