"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Users, Calendar, Shield } from "lucide-react"

export default function HomePage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard if already authenticated
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  const handleGetStarted = () => {
    router.push("/auth/signin")
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800">Memuat...</p>
        </div>
      </div>
    )
  }

  if (status === "authenticated") {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Sistem Peminjaman Fasilitas</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => router.push('/monitor')} 
                variant="outline" 
                className="border-blue-600 text-blue-600 hover:bg-blue-50 font-medium"
              >
                Monitor Ruang
              </Button>
              <Button onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700 text-white font-medium">Masuk</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Kelola Peminjaman Fasilitas
            <span className="block text-blue-600">dengan Mudah</span>
          </h1>
          <p className="text-xl text-gray-800 mb-8 max-w-3xl mx-auto">
            Sistem terintegrasi untuk peminjaman fasilitas yang mendukung mahasiswa, petugas, 
            dan pengguna eksternal dengan proses yang efisien dan transparan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={handleGetStarted} className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-lg px-8 py-3">
              Mulai Sekarang
            </Button>
            <Button size="lg" variant="outline" className="bg-blue-600 hover:bg-blue-700 hover:text-white font-medium text-lg px-8 py-3">
              Pelajari Lebih Lanjut
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-semibold mb-2 text-gray-900">Multi-Role Access</CardTitle>
              <CardDescription className="text-gray-800">
                Mendukung akses untuk mahasiswa (OAuth Google UGM), petugas admin, dan pengguna eksternal
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-xl font-semibold mb-2 text-gray-900">Booking Real-time</CardTitle>
              <CardDescription className="text-gray-800">
                Sistem booking real-time dengan deteksi konflik jadwal dan notifikasi otomatis
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl font-semibold mb-2 text-gray-900">Keamanan Terjamin</CardTitle>
              <CardDescription className="text-gray-800">
                Sistem autentikasi yang aman dengan role-based access control (RBAC)
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* User Types */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Siapa yang Dapat Menggunakan?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Mahasiswa UGM</h3>
              <p className="text-gray-800">
                Login menggunakan akun Google UGM untuk akses cepat dan aman
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Petugas/Admin</h3>
              <p className="text-gray-800">
                Kelola fasilitas, setujui peminjaman, dan pantau sistem secara keseluruhan
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Building className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Pengguna Eksternal</h3>
              <p className="text-gray-800">
                Akses melalui OTP email untuk pengguna dari luar institusi
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Building className="h-6 w-6 mr-2" />
              <span className="text-lg font-semibold">Sistem Peminjaman Fasilitas</span>
            </div>
            <p className="text-gray-400">
              © 2024 Sistem Peminjaman Fasilitas. Semua hak dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
