"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { ArrowLeft, Calendar, Clock, MapPin, User, FileText } from "lucide-react"

interface Peminjaman {
  id: string
  fasilitas: {
    nama: string
    lokasi: string
  }
  tanggalMulai: string
  tanggalSelesai: string
  jamMulai: string
  jamSelesai: string
  keperluan: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'
  createdAt: string
  approvedBy?: string
  rejectedReason?: string
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800'
}

const statusLabels = {
  PENDING: 'Menunggu Persetujuan',
  APPROVED: 'Disetujui',
  REJECTED: 'Ditolak',
  COMPLETED: 'Selesai'
}

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [peminjaman, setPeminjaman] = useState<Peminjaman[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('ALL')

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    loadPeminjaman()
  }, [status, router])

  const loadPeminjaman = async () => {
    try {
      // Get user's bookings from API
      // TODO: Replace with actual user ID from session when NextAuth is properly configured
      const response = await fetch(`/api/bookings?userId=cmeusutb5000b9kvsvrpti7ou&limit=100`)
      const result = await response.json()
      
      if (result.success && result.data) {
        // Transform API data to match component interface
        interface BookingData {
          id: string
          fasilitas: { nama: string; lokasi: string }
          tglMulai: string
          tglSelesai: string
          tujuan: string
          status: string
          createdAt: string
        }
        const transformedData = result.data.map((booking: BookingData) => ({
          id: booking.id,
          fasilitas: {
            nama: booking.fasilitas.nama,
            lokasi: booking.fasilitas.lokasi
          },
          tanggalMulai: new Date(booking.tglMulai).toISOString().split('T')[0],
          tanggalSelesai: new Date(booking.tglSelesai).toISOString().split('T')[0],
          jamMulai: new Date(booking.tglMulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          jamSelesai: new Date(booking.tglSelesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          keperluan: booking.tujuan,
          status: booking.status === 'DIPROSES' ? 'PENDING' : 
                  booking.status === 'DISETUJUI' ? 'APPROVED' : 
                  booking.status === 'DITOLAK' ? 'REJECTED' : 'COMPLETED',
          createdAt: booking.createdAt,
          approvedBy: booking.status === 'DISETUJUI' ? 'Admin Fasilitas' : undefined,
          rejectedReason: booking.status === 'DITOLAK' ? 'Tidak memenuhi syarat' : undefined
        }))
        
        setPeminjaman(transformedData)
      } else {
        console.error('Failed to load bookings:', result.error)
        setPeminjaman([])
      }
    } catch (error) {
      console.error("Error loading bookings:", error)
      // Fallback to empty array instead of alert
      setPeminjaman([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPeminjaman = peminjaman.filter(p => {
    if (filter === 'ALL') return true
    return p.status === filter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800">Memuat riwayat peminjaman...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="mr-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Riwayat Peminjaman</h1>
              <p className="text-gray-600">Lihat semua riwayat booking fasilitas Anda</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'ALL' ? 'default' : 'outline'}
              onClick={() => setFilter('ALL')}
              className={filter === 'ALL' ? 'bg-blue-600 text-white' : ''}
            >
              Semua ({peminjaman.length})
            </Button>
            <Button
              variant={filter === 'PENDING' ? 'default' : 'outline'}
              onClick={() => setFilter('PENDING')}
              className={filter === 'PENDING' ? 'bg-yellow-600 text-white' : ''}
            >
              Menunggu ({peminjaman.filter(p => p.status === 'PENDING').length})
            </Button>
            <Button
              variant={filter === 'APPROVED' ? 'default' : 'outline'}
              onClick={() => setFilter('APPROVED')}
              className={filter === 'APPROVED' ? 'bg-green-600 text-white' : ''}
            >
              Disetujui ({peminjaman.filter(p => p.status === 'APPROVED').length})
            </Button>
            <Button
              variant={filter === 'COMPLETED' ? 'default' : 'outline'}
              onClick={() => setFilter('COMPLETED')}
              className={filter === 'COMPLETED' ? 'bg-blue-600 text-white' : ''}
            >
              Selesai ({peminjaman.filter(p => p.status === 'COMPLETED').length})
            </Button>
            <Button
              variant={filter === 'REJECTED' ? 'default' : 'outline'}
              onClick={() => setFilter('REJECTED')}
              className={filter === 'REJECTED' ? 'bg-red-600 text-white' : ''}
            >
              Ditolak ({peminjaman.filter(p => p.status === 'REJECTED').length})
            </Button>
          </div>
        </div>

        {/* Booking List */}
        {filteredPeminjaman.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada riwayat peminjaman</h3>
              <p className="text-gray-500 mb-4">
                {filter === 'ALL' 
                  ? 'Anda belum pernah melakukan booking fasilitas'
                  : `Tidak ada peminjaman dengan status ${statusLabels[filter as keyof typeof statusLabels]}`
                }
              </p>
              {session?.user?.role !== 'PETUGAS' && (
                <Button
                  onClick={() => router.push('/dashboard/booking')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Buat Booking Baru
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPeminjaman.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold mb-2 text-gray-900">
                        <MapPin className="h-5 w-5 text-gray-500" />
                        {booking.fasilitas.nama}
                      </CardTitle>
                      <CardDescription className="text-gray-800">
                        {booking.fasilitas.lokasi}
                      </CardDescription>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {booking.tanggalMulai === booking.tanggalSelesai 
                            ? formatDate(booking.tanggalMulai)
                            : `${formatDate(booking.tanggalMulai)} - ${formatDate(booking.tanggalSelesai)}`
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{booking.jamMulai} - {booking.jamSelesai}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>Diajukan: {formatDateTime(booking.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Keperluan:</h4>
                        <p className="text-sm text-gray-600">{booking.keperluan}</p>
                      </div>
                      
                      {booking.approvedBy && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Disetujui oleh:</h4>
                          <p className="text-sm text-green-600">{booking.approvedBy}</p>
                        </div>
                      )}
                      
                      {booking.rejectedReason && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Alasan ditolak:</h4>
                          <p className="text-sm text-red-600">{booking.rejectedReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}