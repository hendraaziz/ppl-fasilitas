"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, MapPin, Users, Filter } from "lucide-react"

interface Booking {
  id: string
  tglMulai: string
  tglSelesai: string
  tujuan: string
  status: 'PENDING' | 'DISETUJUI' | 'DITOLAK'
  fasilitas: {
    id: string
    nama: string
    lokasi: string
    kapasitas: number
  }
  user: {
    id: string
    nama: string
    email: string
  }
}

interface Fasilitas {
  id: string
  nama: string
  lokasi: string
  kapasitas: number
  jenis: string
}

type ViewMode = 'day' | 'week' | 'month'

export default function RoomMonitorPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [facilities, setFacilities] = useState<Fasilitas[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedFacility, setSelectedFacility] = useState<string>('')

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    loadData()
  }, [status, router])

  const loadData = async () => {
    try {
      // Load facilities
      const facilitiesResponse = await fetch('/api/facilities?limit=100')
      const facilitiesResult = await facilitiesResponse.json()
      
      if (facilitiesResult.success) {
        setFacilities(facilitiesResult.data)
      }

      // Load bookings
      const bookingsResponse = await fetch('/api/bookings')
      const bookingsResult = await bookingsResponse.json()
      
      if (bookingsResult.success) {
        setBookings(bookingsResult.data)
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDateRange = () => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    switch (viewMode) {
      case 'day':
        end.setDate(start.getDate() + 1)
        break
      case 'week':
        start.setDate(start.getDate() - start.getDay())
        end.setDate(start.getDate() + 7)
        break
      case 'month':
        start.setDate(1)
        end.setMonth(start.getMonth() + 1)
        end.setDate(0)
        break
    }

    return { start, end }
  }

  const getFilteredBookings = () => {
    const { start, end } = getDateRange()
    
    return bookings.filter(booking => {
      const bookingStart = new Date(booking.tglMulai)
      const bookingEnd = new Date(booking.tglSelesai)
      
      // Check if booking overlaps with date range
      const overlaps = bookingStart < end && bookingEnd > start
      
      // Filter by facility if selected
      const facilityMatch = !selectedFacility || booking.fasilitas.id === selectedFacility
      
      // Only show approved bookings
      const isApproved = booking.status === 'DISETUJUI'
      
      return overlaps && facilityMatch && isApproved
    })
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
    }
    
    setCurrentDate(newDate)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDateTitle = () => {
    const { start, end } = getDateRange()
    
    switch (viewMode) {
      case 'day':
        return formatDate(currentDate)
      case 'week':
        return `${start.toLocaleDateString('id-ID')} - ${end.toLocaleDateString('id-ID')}`
      case 'month':
        return currentDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800">Memuat data monitoring...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const filteredBookings = getFilteredBookings()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="mr-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Monitor Penggunaan Ruang</h1>
                <p className="text-gray-600">Pantau jadwal penggunaan fasilitas</p>
              </div>
            </div>
            
            {/* View Mode Selector */}
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('day')}
              >
                Hari
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Minggu
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Bulan
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigateDate('prev')}
            >
              ← Sebelumnya
            </Button>
            <h2 className="text-xl font-semibold text-gray-900">
              {getDateTitle()}
            </h2>
            <Button
              variant="outline"
              onClick={() => navigateDate('next')}
            >
              Selanjutnya →
            </Button>
          </div>
          
          {/* Facility Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Semua Fasilitas</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.nama} - {facility.lokasi}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada booking</h3>
                <p className="text-gray-500">
                  Tidak ada booking yang disetujui untuk periode ini.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.fasilitas.nama}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {formatDate(new Date(booking.tglMulai))}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">
                            {formatTime(booking.tglMulai)} - {formatTime(booking.tglSelesai)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="h-4 w-4" />
                          <span className="text-sm">
                            {booking.user.nama}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="text-sm font-medium">Lokasi:</span>
                          <span className="text-sm">{booking.fasilitas.lokasi}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Keperluan:</span> {booking.tujuan}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}