"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Building, FileText, Settings, LogOut, Monitor, Shield } from "lucide-react"
import { useAuth, logout } from "@/hooks/useAuth"

interface DashboardStats {
  totalFasilitas: number
  totalPeminjaman: number
  peminjamanAktif: number
  peminjamanPending: number
}

export default function DashboardPage() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalFasilitas: 0,
    totalPeminjaman: 0,
    peminjamanAktif: 0,
    peminjamanPending: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    
    if (!isAuthenticated) {
      router.push("/auth/signin")
      return
    }

    // Load dashboard stats
    loadDashboardStats()
  }, [authLoading, isAuthenticated, router])

  const loadDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const result = await response.json()
      
      if (result.success && result.data) {
        const { overview } = result.data
        setStats({
          totalFasilitas: overview.totalFacilities,
          totalPeminjaman: overview.totalBookings,
          peminjamanAktif: overview.approvedBookings,
          peminjamanPending: overview.pendingBookings
        })
      } else {
        console.error("Failed to load dashboard stats:", result.error)
        // Fallback to default values if API fails
        setStats({
          totalFasilitas: 0,
          totalPeminjaman: 0,
          peminjamanAktif: 0,
          peminjamanPending: 0
        })
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
      // Fallback to default values if API fails
      setStats({
        totalFasilitas: 0,
        totalPeminjaman: 0,
        peminjamanAktif: 0,
        peminjamanPending: 0
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await logout()
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userRole = user.role
  const userName = user.name || user.email

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-2 border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
              <p className="text-lg text-gray-700 font-medium">Selamat datang, {userName}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 px-4 py-2 rounded-lg">
                <span className="text-sm font-semibold text-blue-800">
                  Role: <span className="font-bold text-blue-900">{userRole}</span>
                </span>
              </div>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="flex items-center gap-2 border-2 border-red-500 text-red-600 hover:bg-red-500 hover:text-white font-semibold px-4 py-2 transition-all duration-200"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-lg border-2 border-blue-200 hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-blue-50">
              <CardTitle className="text-base font-bold text-gray-900">Total Fasilitas</CardTitle>
              <Building className="h-6 w-6 text-blue-600" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-blue-700">{stats.totalFasilitas}</div>
              <p className="text-sm font-medium text-gray-600 mt-1">Fasilitas tersedia</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-2 border-green-200 hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-green-50">
              <CardTitle className="text-base font-bold text-gray-900">Total Peminjaman</CardTitle>
              <FileText className="h-6 w-6 text-green-600" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-green-700">{stats.totalPeminjaman}</div>
              <p className="text-sm font-medium text-gray-600 mt-1">Semua peminjaman</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-2 border-orange-200 hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-orange-50">
              <CardTitle className="text-base font-bold text-gray-900">Peminjaman Aktif</CardTitle>
              <Calendar className="h-6 w-6 text-orange-600" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-orange-700">{stats.peminjamanAktif}</div>
              <p className="text-sm font-medium text-gray-600 mt-1">Sedang berlangsung</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-2 border-purple-200 hover:shadow-xl transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-purple-50">
              <CardTitle className="text-base font-bold text-gray-900">Menunggu Persetujuan</CardTitle>
              <Users className="h-6 w-6 text-purple-600" />
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-purple-700">{stats.peminjamanPending}</div>
              <p className="text-sm font-medium text-gray-600 mt-1">Perlu ditinjau</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Booking Fasilitas - Available for all roles */}
          <Card className="cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 bg-white border-2 border-blue-200"
                onClick={() => router.push('/dashboard/booking')}>
            <CardHeader className="bg-blue-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
                <Calendar className="h-6 w-6 text-blue-600" />
                Booking Fasilitas
              </CardTitle>
              <CardDescription className="text-base font-medium text-gray-700">
                Ajukan peminjaman fasilitas baru
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-base transition-colors duration-200">Buat Booking Baru</Button>
            </CardContent>
          </Card>

          {/* Riwayat Peminjaman - Available for all roles */}
          <Card className="cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 bg-white border-2 border-green-200"
                onClick={() => router.push('/dashboard/history')}>
            <CardHeader className="bg-green-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
                <FileText className="h-6 w-6 text-green-600" />
                Riwayat Peminjaman
              </CardTitle>
              <CardDescription className="text-base font-medium text-gray-700">
                Lihat riwayat peminjaman Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base transition-colors duration-200">Lihat Riwayat</Button>
            </CardContent>
          </Card>

          {/* Room Monitor - Available for all roles */}
          <Card className="cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 bg-white border-2 border-teal-200"
                onClick={() => router.push('/dashboard/room-monitor')}>
            <CardHeader className="bg-teal-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
                <Monitor className="h-6 w-6 text-teal-600" />
                Monitor Ruang
              </CardTitle>
              <CardDescription className="text-base font-medium text-gray-700">
                Pantau penggunaan fasilitas real-time
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 text-base transition-colors duration-200">Lihat Monitor</Button>
            </CardContent>
          </Card>

          {/* Admin Features - Only for PETUGAS */}
          {userRole === 'PETUGAS' && (
            <>
              <Card className="cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 bg-white border-2 border-orange-200"
                    onClick={() => router.push('/dashboard/admin/facilities')}>
                <CardHeader className="bg-orange-50 pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
                    <Building className="h-6 w-6 text-orange-600" />
                    Kelola Fasilitas
                  </CardTitle>
                  <CardDescription className="text-base font-medium text-gray-700">
                    Tambah, edit, dan kelola fasilitas
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 text-base transition-colors duration-200">Kelola Fasilitas</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 bg-white border-2 border-purple-200"
                    onClick={() => router.push('/dashboard/admin/bookings')}>
                <CardHeader className="bg-purple-50 pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
                    <Users className="h-6 w-6 text-purple-600" />
                    Kelola Peminjaman
                  </CardTitle>
                  <CardDescription className="text-base font-medium text-gray-700">
                    Setujui atau tolak peminjaman
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 text-base transition-colors duration-200">Kelola Peminjaman</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 bg-white border-2 border-indigo-200"
                    onClick={() => router.push('/dashboard/admin/users')}>
                <CardHeader className="bg-indigo-50 pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
                    <Settings className="h-6 w-6 text-indigo-600" />
                    Kelola Pengguna
                  </CardTitle>
                  <CardDescription className="text-base font-medium text-gray-700">
                    Kelola data pengguna sistem
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 text-base transition-colors duration-200">Kelola Pengguna</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 bg-white border-2 border-red-200"
                    onClick={() => router.push('/dashboard/admin/reset-password')}>
                <CardHeader className="bg-red-50 pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
                    <Shield className="h-6 w-6 text-red-600" />
                    Reset Password
                  </CardTitle>
                  <CardDescription className="text-base font-medium text-gray-700">
                    Reset password admin/petugas
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 text-base transition-colors duration-200">Reset Password</Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Profile - Available for all roles */}
          <Card className="cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 bg-white border-2 border-gray-300"
                onClick={() => router.push('/dashboard/profile')}>
            <CardHeader className="bg-gray-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
                <Settings className="h-6 w-6 text-gray-600" />
                Profil Saya
              </CardTitle>
              <CardDescription className="text-base font-medium text-gray-700">
                Kelola informasi profil Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 text-base transition-colors duration-200">Edit Profil</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}