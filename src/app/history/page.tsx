"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  FileText, 
  Search,

  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from "lucide-react"

// Mock data for booking history
const mockBookings = [
  {
    id: 1,
    fasilitas: {
      nama: "Ruang Seminar A",
      lokasi: "Gedung A Lantai 2"
    },
    tanggalMulai: "2024-01-15",
    tanggalSelesai: "2024-01-15",
    jamMulai: "09:00",
    jamSelesai: "12:00",
    tujuan: "Workshop UI/UX Design",
    jumlahPeserta: 25,
    status: "DISETUJUI",
    tanggalPengajuan: "2024-01-10",
    keterangan: "Workshop untuk mahasiswa desain"
  },
  {
    id: 2,
    fasilitas: {
      nama: "Aula Utama",
      lokasi: "Gedung Utama Lantai 1"
    },
    tanggalMulai: "2024-01-20",
    tanggalSelesai: "2024-01-20",
    jamMulai: "13:00",
    jamSelesai: "17:00",
    tujuan: "Seminar Teknologi",
    jumlahPeserta: 150,
    status: "MENUNGGU",
    tanggalPengajuan: "2024-01-12",
    keterangan: "Seminar tentang AI dan Machine Learning"
  },
  {
    id: 3,
    fasilitas: {
      nama: "Ruang Meeting B",
      lokasi: "Gedung B Lantai 3"
    },
    tanggalMulai: "2024-01-08",
    tanggalSelesai: "2024-01-08",
    jamMulai: "14:00",
    jamSelesai: "16:00",
    tujuan: "Meeting Tim Proyek",
    jumlahPeserta: 15,
    status: "DITOLAK",
    tanggalPengajuan: "2024-01-05",
    keterangan: "Meeting rutin tim pengembangan",
    alasanPenolakan: "Fasilitas sedang dalam perbaikan"
  },
  {
    id: 4,
    fasilitas: {
      nama: "Lab Komputer 1",
      lokasi: "Gedung C Lantai 1"
    },
    tanggalMulai: "2024-01-25",
    tanggalSelesai: "2024-01-25",
    jamMulai: "08:00",
    jamSelesai: "11:00",
    tujuan: "Praktikum Pemrograman",
    jumlahPeserta: 30,
    status: "SELESAI",
    tanggalPengajuan: "2024-01-18",
    keterangan: "Praktikum mata kuliah pemrograman web"
  }
]

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings] = useState(mockBookings)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("SEMUA")
  const [selectedBooking, setSelectedBooking] = useState<typeof mockBookings[0] | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DISETUJUI":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "DITOLAK":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "MENUNGGU":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case "SELESAI":
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DISETUJUI":
        return "bg-green-100 text-green-800"
      case "DITOLAK":
        return "bg-red-100 text-red-800"
      case "MENUNGGU":
        return "bg-yellow-100 text-yellow-800"
      case "SELESAI":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.fasilitas.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.tujuan.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "SEMUA" || booking.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Riwayat Peminjaman</h1>
          <p className="text-gray-600 mt-2">Lihat semua riwayat booking fasilitas Anda</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters and Search */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Filter & Pencarian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cari Booking
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Nama fasilitas atau tujuan..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="SEMUA">Semua Status</option>
                    <option value="MENUNGGU">Menunggu</option>
                    <option value="DISETUJUI">Disetujui</option>
                    <option value="DITOLAK">Ditolak</option>
                    <option value="SELESAI">Selesai</option>
                  </select>
                </div>

                {/* Statistics */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Statistik</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Booking:</span>
                      <span className="font-medium">{bookings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Disetujui:</span>
                      <span className="font-medium text-green-600">
                        {bookings.filter(b => b.status === "DISETUJUI").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Menunggu:</span>
                      <span className="font-medium text-yellow-600">
                        {bookings.filter(b => b.status === "MENUNGGU").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ditolak:</span>
                      <span className="font-medium text-red-600">
                        {bookings.filter(b => b.status === "DITOLAK").length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bookings List */}
          <div className="lg:col-span-3">
            {filteredBookings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada booking ditemukan</h3>
                  <p className="text-gray-600">Coba ubah filter atau kata kunci pencarian</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <Card key={booking.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center">
                            <Building className="h-5 w-5 mr-2" />
                            {booking.fasilitas.nama}
                          </CardTitle>
                          <CardDescription className="flex items-center mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            {booking.fasilitas.lokasi}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            getStatusColor(booking.status)
                          }`}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1">{booking.status}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Detail
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(booking.tanggalMulai)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatTime(booking.jamMulai)} - {formatTime(booking.jamSelesai)}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2" />
                          {booking.jumlahPeserta} peserta
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-900">Tujuan:</p>
                        <p className="text-sm text-gray-600">{booking.tujuan}</p>
                      </div>
                      
                      {booking.status === "DITOLAK" && booking.alasanPenolakan && (
                        <Alert className="mt-3 border-red-200 bg-red-50">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription className="text-red-800">
                            <strong>Alasan Penolakan:</strong> {booking.alasanPenolakan}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Detail Booking #{selectedBooking.id}</CardTitle>
                    <CardDescription>{selectedBooking.fasilitas.nama}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedBooking(null)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Fasilitas</Label>
                    <p className="text-sm text-gray-900">{selectedBooking.fasilitas.nama}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Lokasi</Label>
                    <p className="text-sm text-gray-900">{selectedBooking.fasilitas.lokasi}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tanggal Mulai</Label>
                    <p className="text-sm text-gray-900">{formatDate(selectedBooking.tanggalMulai)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tanggal Selesai</Label>
                    <p className="text-sm text-gray-900">{formatDate(selectedBooking.tanggalSelesai)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Jam Mulai</Label>
                    <p className="text-sm text-gray-900">{formatTime(selectedBooking.jamMulai)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Jam Selesai</Label>
                    <p className="text-sm text-gray-900">{formatTime(selectedBooking.jamSelesai)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Jumlah Peserta</Label>
                    <p className="text-sm text-gray-900">{selectedBooking.jumlahPeserta} orang</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      getStatusColor(selectedBooking.status)
                    }`}>
                      {getStatusIcon(selectedBooking.status)}
                      <span className="ml-1">{selectedBooking.status}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Tujuan Penggunaan</Label>
                  <p className="text-sm text-gray-900">{selectedBooking.tujuan}</p>
                </div>
                
                {selectedBooking.keterangan && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Keterangan</Label>
                    <p className="text-sm text-gray-900">{selectedBooking.keterangan}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Tanggal Pengajuan</Label>
                  <p className="text-sm text-gray-900">{formatDate(selectedBooking.tanggalPengajuan)}</p>
                </div>
                
                {selectedBooking.status === "DITOLAK" && selectedBooking.alasanPenolakan && (
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-800">
                      <strong>Alasan Penolakan:</strong> {selectedBooking.alasanPenolakan}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}