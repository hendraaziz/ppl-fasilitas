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
  Search,
  Calendar,
  Clock,
  User,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Filter
} from "lucide-react"

// Mock data for bookings
const mockBookings = [
  {
    id: 1,
    nomorBooking: "BK001",
    namaFasilitas: "Ruang Seminar A",
    namaPeminjam: "John Doe",
    emailPeminjam: "john@ugm.ac.id",
    tipePengguna: "MAHASISWA",
    tanggalMulai: "2024-01-15",
    tanggalSelesai: "2024-01-15",
    waktuMulai: "09:00",
    waktuSelesai: "12:00",
    keperluan: "Seminar Tugas Akhir",
    status: "PENDING",
    tanggalPengajuan: "2024-01-10",
    fileSurat: "surat_permohonan_001.pdf"
  },
  {
    id: 2,
    nomorBooking: "BK002",
    namaFasilitas: "Aula Utama",
    namaPeminjam: "Jane Smith",
    emailPeminjam: "jane.smith@gmail.com",
    tipePengguna: "EKSTERNAL",
    tanggalMulai: "2024-01-20",
    tanggalSelesai: "2024-01-20",
    waktuMulai: "14:00",
    waktuSelesai: "18:00",
    keperluan: "Workshop Teknologi",
    status: "APPROVED",
    tanggalPengajuan: "2024-01-08",
    fileSurat: "surat_permohonan_002.pdf"
  },
  {
    id: 3,
    nomorBooking: "BK003",
    namaFasilitas: "Lab Komputer 1",
    namaPeminjam: "Ahmad Rahman",
    emailPeminjam: "ahmad@staff.ugm.ac.id",
    tipePengguna: "PETUGAS",
    tanggalMulai: "2024-01-18",
    tanggalSelesai: "2024-01-19",
    waktuMulai: "08:00",
    waktuSelesai: "16:00",
    keperluan: "Pelatihan Sistem Informasi",
    status: "REJECTED",
    tanggalPengajuan: "2024-01-12",
    fileSurat: "surat_permohonan_003.pdf",
    alasanPenolakan: "Bentrok dengan jadwal maintenance"
  },
  {
    id: 4,
    nomorBooking: "BK004",
    namaFasilitas: "Ruang Meeting B",
    namaPeminjam: "Sarah Wilson",
    emailPeminjam: "sarah@ugm.ac.id",
    tipePengguna: "MAHASISWA",
    tanggalMulai: "2024-01-25",
    tanggalSelesai: "2024-01-25",
    waktuMulai: "10:00",
    waktuSelesai: "14:00",
    keperluan: "Rapat Organisasi Mahasiswa",
    status: "COMPLETED",
    tanggalPengajuan: "2024-01-05",
    fileSurat: "surat_permohonan_004.pdf"
  }
]

export default function AdminBookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState(mockBookings)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedBooking, setSelectedBooking] = useState<typeof mockBookings[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated" && session?.user?.role !== "PETUGAS") {
      router.push("/dashboard")
    }
  }, [status, session, router])

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.nomorBooking.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.namaFasilitas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.namaPeminjam.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "ALL" || booking.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleStatusUpdate = async (bookingId: number, newStatus: string, alasan?: string) => {
    setIsLoading(true)
    setMessage(null)

    try {
      // TODO: Implement API call
      // const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus, alasan })
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: newStatus, alasanPenolakan: alasan }
          : booking
      ))
      
      const statusText = {
        'APPROVED': 'disetujui',
        'REJECTED': 'ditolak',
        'COMPLETED': 'diselesaikan'
      }[newStatus] || 'diperbarui'
      
      setMessage({ type: "success", text: `Booking berhasil ${statusText}` })
      setIsModalOpen(false)
    } catch {
      setMessage({ type: "error", text: "Gagal memperbarui status booking" })
    } finally {
      setIsLoading(false)
    }
  }

  const openModal = (booking: typeof mockBookings[0]) => {
    setSelectedBooking(booking)
    setIsModalOpen(true)
    setMessage(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedBooking(null)
    setMessage(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "COMPLETED":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <AlertCircle className="h-4 w-4" />
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />
      case "REJECTED":
        return <XCircle className="h-4 w-4" />
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getTipePenggunaColor = (tipe: string) => {
    switch (tipe) {
      case "MAHASISWA":
        return "bg-blue-100 text-blue-800"
      case "PETUGAS":
        return "bg-purple-100 text-purple-800"
      case "EKSTERNAL":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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

  if (!session || session.user.role !== "PETUGAS") {
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kelola Peminjaman</h1>
              <p className="text-gray-600 mt-2">Kelola dan review semua peminjaman fasilitas</p>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {message && (
          <Alert className={`mb-6 ${message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari booking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
              <option value="COMPLETED">Selesai</option>
            </select>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.nomorBooking}
                      </h3>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(booking.status)
                      }`}>
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getTipePenggunaColor(booking.tipePengguna)
                      }`}>
                        {booking.tipePengguna}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        {booking.namaFasilitas}
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        {booking.namaPeminjam}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {booking.tanggalMulai}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {booking.waktuMulai} - {booking.waktuSelesai}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Keperluan:</span> {booking.keperluan}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModal(booking)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Detail
                    </Button>
                    {booking.fileSurat && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Implement file download
                          console.log('Download file:', booking.fileSurat)
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Surat
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detail Modal */}
        {isModalOpen && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Detail Peminjaman</CardTitle>
                    <CardDescription>Informasi lengkap peminjaman fasilitas</CardDescription>
                  </div>
                  <Button variant="ghost" onClick={closeModal}>
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Booking Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Nomor Booking</Label>
                      <p className="text-sm text-gray-900">{selectedBooking.nomorBooking}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Fasilitas</Label>
                      <p className="text-sm text-gray-900">{selectedBooking.namaFasilitas}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Tanggal</Label>
                      <p className="text-sm text-gray-900">
                        {selectedBooking.tanggalMulai} - {selectedBooking.tanggalSelesai}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Waktu</Label>
                      <p className="text-sm text-gray-900">
                        {selectedBooking.waktuMulai} - {selectedBooking.waktuSelesai}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Nama Peminjam</Label>
                      <p className="text-sm text-gray-900">{selectedBooking.namaPeminjam}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <p className="text-sm text-gray-900">{selectedBooking.emailPeminjam}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Tipe Pengguna</Label>
                      <p className="text-sm text-gray-900">{selectedBooking.tipePengguna}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Tanggal Pengajuan</Label>
                      <p className="text-sm text-gray-900">{selectedBooking.tanggalPengajuan}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-700">Keperluan</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedBooking.keperluan}</p>
                </div>
                
                {selectedBooking.alasanPenolakan && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Alasan Penolakan</Label>
                    <p className="text-sm text-red-600 mt-1">{selectedBooking.alasanPenolakan}</p>
                  </div>
                )}
                
                {/* Status Actions */}
                {selectedBooking.status === "PENDING" && (
                  <div className="border-t pt-6">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Aksi</Label>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleStatusUpdate(selectedBooking.id, "APPROVED")}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isLoading ? "Memproses..." : "Setujui"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          const alasan = prompt("Masukkan alasan penolakan:")
                          if (alasan) {
                            handleStatusUpdate(selectedBooking.id, "REJECTED", alasan)
                          }
                        }}
                        disabled={isLoading}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Tolak
                      </Button>
                    </div>
                  </div>
                )}
                
                {selectedBooking.status === "APPROVED" && (
                  <div className="border-t pt-6">
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">Aksi</Label>
                    <Button
                      onClick={() => handleStatusUpdate(selectedBooking.id, "COMPLETED")}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isLoading ? "Memproses..." : "Tandai Selesai"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}