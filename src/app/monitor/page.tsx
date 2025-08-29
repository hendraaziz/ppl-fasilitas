"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, ArrowLeft, Clock, Users, MapPin } from "lucide-react"

interface Facility {
  id: string
  nama: string
  lokasi: string
  kapasitas: number
  deskripsi?: string
  status: 'tersedia' | 'sedang_digunakan' | 'maintenance'
}

interface Booking {
  id: string
  fasilitasId: string
  tglMulai: string
  tglSelesai: string
  jamMulai: string
  jamSelesai: string
  status: string
}

export default function MonitorPage() {
  const router = useRouter()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    fetchFacilities()
    fetchBookings()
    
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  const fetchFacilities = async () => {
    try {
      const response = await fetch('/api/facilities')
      if (response.ok) {
        const data = await response.json()
        setFacilities(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching facilities:', error)
    }
  }

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings')
      if (response.ok) {
        const data = await response.json()
        setBookings(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFacilityStatus = (facilityId: string): 'tersedia' | 'sedang_digunakan' | 'maintenance' => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)

    const activeBooking = bookings.find(booking => {
      if (booking.fasilitasId !== facilityId || booking.status !== 'disetujui') {
        return false
      }

      const bookingStart = new Date(booking.tglMulai)
      const bookingEnd = new Date(booking.tglSelesai)
      const bookingStartDate = bookingStart.toISOString().split('T')[0]
      const bookingEndDate = bookingEnd.toISOString().split('T')[0]

      // Check if today is within booking date range
      if (today >= bookingStartDate && today <= bookingEndDate) {
        // If it's a single day booking, check time
        if (bookingStartDate === bookingEndDate) {
          return currentTime >= booking.jamMulai && currentTime <= booking.jamSelesai
        }
        // Multi-day booking
        return true
      }
      return false
    })

    return activeBooking ? 'sedang_digunakan' : 'tersedia'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'tersedia':
        return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 border-transparent">Tersedia</span>
      case 'sedang_digunakan':
        return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800 border-transparent">Sedang Digunakan</span>
      case 'maintenance':
        return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 border-transparent">Maintenance</span>
      default:
        return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 border-transparent">Unknown</span>
    }
  }

  const getCurrentBooking = (facilityId: string) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTime = now.toTimeString().slice(0, 5)

    return bookings.find(booking => {
      if (booking.fasilitasId !== facilityId || booking.status !== 'disetujui') {
        return false
      }

      const bookingStart = new Date(booking.tglMulai)
      const bookingEnd = new Date(booking.tglSelesai)
      const bookingStartDate = bookingStart.toISOString().split('T')[0]
      const bookingEndDate = bookingEnd.toISOString().split('T')[0]

      if (today >= bookingStartDate && today <= bookingEndDate) {
        if (bookingStartDate === bookingEndDate) {
          return currentTime >= booking.jamMulai && currentTime <= booking.jamSelesai
        }
        return true
      }
      return false
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800">Memuat data fasilitas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="mr-4 p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Building className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Monitor Ruang</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <Clock className="h-4 w-4 inline mr-1" />
                {currentTime.toLocaleString('id-ID')}
              </div>
              <Button onClick={() => router.push('/auth/signin')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">
                Masuk
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Status Fasilitas Real-time</h2>
          <p className="text-gray-600">Pantau ketersediaan fasilitas secara langsung tanpa perlu login</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Fasilitas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{facilities.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tersedia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {facilities.filter(f => getFacilityStatus(f.id) === 'tersedia').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sedang Digunakan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {facilities.filter(f => getFacilityStatus(f.id) === 'sedang_digunakan').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((facility) => {
            const status = getFacilityStatus(facility.id)
            const currentBooking = getCurrentBooking(facility.id)
            
            return (
              <Card key={facility.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {facility.nama}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-4 w-4 mr-1" />
                        {facility.lokasi}
                      </CardDescription>
                    </div>
                    {getStatusBadge(status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      Kapasitas: {facility.kapasitas} orang
                    </div>
                    
                    {facility.deskripsi && (
                      <p className="text-sm text-gray-600">{facility.deskripsi}</p>
                    )}
                    
                    {currentBooking && (
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-red-800 mb-1">
                          Sedang digunakan
                        </p>
                        <p className="text-xs text-red-600">
                          {currentBooking.jamMulai} - {currentBooking.jamSelesai}
                        </p>
                        {new Date(currentBooking.tglMulai).toDateString() !== new Date(currentBooking.tglSelesai).toDateString() && (
                          <p className="text-xs text-red-600">
                            {new Date(currentBooking.tglMulai).toLocaleDateString('id-ID')} - {new Date(currentBooking.tglSelesai).toLocaleDateString('id-ID')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {facilities.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Tidak ada fasilitas yang tersedia</p>
          </div>
        )}
      </main>
    </div>
  )
}