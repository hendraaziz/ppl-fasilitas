import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    // TODO: Add authentication check when NextAuth is properly configured
    // const session = await getServerSession(authOptions)
    // if (!session) {
    //   return NextResponse.json(
    //     { success: false, error: 'Unauthorized' },
    //     { status: 401 }
    //   )
    // }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') // For user-specific stats
    const role = searchParams.get('role') // For role-based filtering

    // Get current date for filtering
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Base statistics for all users
    const baseStats = await Promise.all([
      // Total facilities (only available/active ones)
      prisma.fasilitas.count({ where: { tersedia: true } }),
      
      // Total bookings
      prisma.peminjaman.count(userId ? { where: { userId } } : undefined),
      
      // Pending bookings
      prisma.peminjaman.count({
        where: {
          status: 'DIPROSES',
          ...(userId && { userId })
        }
      }),
      
      // Approved bookings
      prisma.peminjaman.count({
        where: {
          status: 'DISETUJUI',
          ...(userId && { userId })
        }
      }),
      
      // Rejected bookings
      prisma.peminjaman.count({
        where: {
          status: 'DITOLAK',
          ...(userId && { userId })
        }
      }),
      
      // This month's bookings
      prisma.peminjaman.count({
        where: {
          createdAt: {
            gte: startOfMonth
          },
          ...(userId && { userId })
        }
      }),
      
      // This year's bookings
      prisma.peminjaman.count({
        where: {
          createdAt: {
            gte: startOfYear
          },
          ...(userId && { userId })
        }
      })
    ])

    const [
      totalFacilities,
      totalBookings,
      pendingBookings,
      approvedBookings,
      rejectedBookings,
      monthlyBookings,
      yearlyBookings
    ] = baseStats

    // Additional stats for PETUGAS role
    let adminStats = {}
    if (role === 'PETUGAS') {
      const additionalStats = await Promise.all([
        // Total users
        prisma.pengguna.count(),
        
        // Users by type
        prisma.pengguna.count({ where: { tipePengguna: 'MAHASISWA' } }),
        prisma.pengguna.count({ where: { tipePengguna: 'EKSTERNAL' } }),
        
        // Recent bookings (last 7 days)
        prisma.peminjaman.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        
        // Most popular facilities
        prisma.peminjaman.groupBy({
          by: ['fasilitasId'],
          _count: {
            fasilitasId: true
          },
          orderBy: {
            _count: {
              fasilitasId: 'desc'
            }
          },
          take: 5
        })
      ])

      const [
        totalUsers,
        mahasiswaCount,
        eksternalCount,
        recentBookings,
        popularFacilities
      ] = additionalStats

      // Get facility names for popular facilities
      const facilityIds = popularFacilities.map(f => f.fasilitasId)
      const facilities = await prisma.fasilitas.findMany({
        where: {
          id: {
            in: facilityIds
          }
        },
        select: {
          id: true,
          nama: true,
          lokasi: true
        }
      })

      const popularFacilitiesWithNames = popularFacilities.map(pf => {
        const facility = facilities.find(f => f.id === pf.fasilitasId)
        return {
          id: pf.fasilitasId,
          nama: facility?.nama || 'Unknown',
          lokasi: facility?.lokasi || 'Unknown',
          bookingCount: pf._count.fasilitasId
        }
      })

      adminStats = {
        totalUsers,
        usersByType: {
          mahasiswa: mahasiswaCount,
          eksternal: eksternalCount
        },
        recentBookings,
        popularFacilities: popularFacilitiesWithNames
      }
    }

    // Monthly booking trends (last 6 months)
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      
      const count = await prisma.peminjaman.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextMonth
          },
          ...(userId && { userId })
        }
      })
      
      monthlyTrends.push({
        month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        count
      })
    }

    // Status distribution
    const statusDistribution = await prisma.peminjaman.groupBy({
      by: ['status'],
      _count: {
        status: true
      },
      ...(userId && {
        where: { userId }
      })
    })

    const statusStats = statusDistribution.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.status
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalFacilities,
          totalBookings,
          pendingBookings,
          approvedBookings,
          rejectedBookings,
          monthlyBookings,
          yearlyBookings
        },
        trends: {
          monthly: monthlyTrends,
          statusDistribution: statusStats
        },
        ...adminStats
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil statistik dashboard' },
      { status: 500 }
    )
  }
}