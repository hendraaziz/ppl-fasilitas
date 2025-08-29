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
  Filter,
  Plus,
  Upload
} from "lucide-react"

// Interface for facility data
interface Facility {
  id: string
  nama: string
  lokasi: string
  jenis: string
  kapasitas: number
  deskripsi?: string
  tersedia: boolean
}

// Interface for booking data
interface Booking {
  id: number
  nomorBooking: string
  namaFasilitas: string
  namaPeminjam: string
  emailPeminjam: string
  tipePengguna: string
  tanggalMulai: string
  tanggalSelesai: string
  waktuMulai: string
  waktuSelesai: string
  keperluan: string
  status: string
  tanggalPengajuan: string
  fileSurat?: string
  keterangan?: string
  alasanPenolakan?: string
  dokumenUrl?: string
}

export default function AdminBookingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    namaPeminjam: "",
    emailPeminjam: "",
    tipePengguna: "MAHASISWA" as "MAHASISWA" | "EKSTERNAL",
    fasilitasId: "",
    tanggalMulai: "",
    tanggalSelesai: "",
    jamMulai: "",
    jamSelesai: "",
    tujuan: "",
    keterangan: "",
    dokumenFile: null as File | null
  })

  // Fetch facilities from API
  const fetchFacilities = async () => {
    try {
      setIsLoadingFacilities(true)
      const response = await fetch('/api/facilities')
      const data = await response.json()
      
      if (data.success) {
        setFacilities(data.data)
      }
    } catch (error) {
      console.error('Error fetching facilities:', error)
    } finally {
      setIsLoadingFacilities(false)
    }
  }

  // Map database status to UI status
  const mapDatabaseStatusToUI = (dbStatus: string) => {
    const statusMap: { [key: string]: string } = {
      'DIPROSES': 'PENDING',
      'DISETUJUI': 'APPROVED', 
      'DITOLAK': 'REJECTED',
      'SELESAI': 'COMPLETED',
      'PERLU_REVISI': 'PENDING'
    }
    return statusMap[dbStatus] || dbStatus
  }

  // Fetch bookings from API
  const fetchBookings = async () => {
    try {
      setIsLoadingBookings(true)
      const response = await fetch('/api/bookings?limit=100')
      const data = await response.json()
      
      if (data.success && data.data) {
        // Transform API data to match component interface
        const transformedBookings = data.data.map((booking: any) => ({
          id: booking.id,
          nomorBooking: booking.nomorBooking || `BKcmew${booking.id}`,
          namaFasilitas: booking.fasilitas.nama,
          namaPeminjam: booking.user.nama,
          emailPeminjam: booking.user.email,
          tipePengguna: booking.user.tipePengguna,
          tanggalMulai: new Date(booking.tglMulai).toISOString().split('T')[0],
          tanggalSelesai: new Date(booking.tglSelesai).toISOString().split('T')[0],
          waktuMulai: new Date(booking.tglMulai).toTimeString().slice(0, 5),
          waktuSelesai: new Date(booking.tglSelesai).toTimeString().slice(0, 5),
          keperluan: booking.tujuan,
          status: mapDatabaseStatusToUI(booking.status),
          tanggalPengajuan: new Date(booking.createdAt).toISOString().split('T')[0],
          fileSurat: `surat_${booking.id}.pdf`,
          keterangan: booking.keterangan,
          alasanPenolakan: booking.alasanTolak
        }))
        setBookings(transformedBookings)
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setBookings([])
    } finally {
      setIsLoadingBookings(false)
    }
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated" && session?.user?.role !== "PETUGAS") {
      router.push("/dashboard")
    } else if (status === "authenticated" && session?.user?.role === "PETUGAS") {
      fetchFacilities()
      fetchBookings()
    }
  }, [status, session, router])

  // Handle form input changes
  const handleFormChange = (field: string, value: string | File | null) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setMessage({ type: "error", text: "File tidak boleh lebih dari 2MB" })
        return
      }
      if (file.type !== "application/pdf") {
        setMessage({ type: "error", text: "File harus berformat PDF" })
        return
      }
      handleFormChange('dokumenFile', file)
    }
  }

  // Submit new booking
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setIsLoading(true)
      setMessage(null) // Clear previous messages
      
      // Validasi form fields
      if (!bookingForm.namaPeminjam || !bookingForm.emailPeminjam || !bookingForm.fasilitasId || 
          !bookingForm.tanggalMulai || !bookingForm.tanggalSelesai || !bookingForm.jamMulai || 
          !bookingForm.jamSelesai || !bookingForm.tujuan) {
        setMessage({ type: "error", text: "Semua field wajib harus diisi" })
        setIsLoading(false)
        return
      }
      
      // Validasi datetime
      const startDateTime = new Date(`${bookingForm.tanggalMulai}T${bookingForm.jamMulai}:00`)
      const endDateTime = new Date(`${bookingForm.tanggalSelesai}T${bookingForm.jamSelesai}:00`)
      
      console.log('Start DateTime:', startDateTime)
      console.log('End DateTime:', endDateTime)
      
      if (endDateTime <= startDateTime) {
        setMessage({ type: "error", text: "Tanggal dan jam selesai harus lebih besar dari tanggal dan jam mulai" })
        setIsLoading(false)
        return
      }
      
      // Create FormData for file upload
      const formData = new FormData()
      Object.entries(bookingForm).forEach(([key, value]) => {
        if (value !== null && value !== "") {
          if (key === 'dokumenFile' && value instanceof File) {
            formData.append(key, value)
          } else if (key !== 'dokumenFile') {
            formData.append(key, String(value))
          }
        }
      })
      
      // Debug FormData
      console.log('FormData entries:')
      for (let [key, value] of formData.entries()) {
        console.log(key, value)
      }
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      console.log('API Response:', data)
      
      if (data.success) {
        setMessage({ type: "success", text: "Booking berhasil dibuat" })
        setIsCreateModalOpen(false)
        // Reset form
        setBookingForm({
          namaPeminjam: "",
          emailPeminjam: "",
          tipePengguna: "MAHASISWA",
          fasilitasId: "",
          tanggalMulai: "",
          tanggalSelesai: "",
          jamMulai: "",
          jamSelesai: "",
          tujuan: "",
          keterangan: "",
          dokumenFile: null
        })
        // Refresh bookings list from API
        await fetchBookings()
      } else {
        setMessage({ type: "error", text: data.error || data.message || "Gagal membuat booking" })
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      setMessage({ type: "error", text: "Terjadi kesalahan saat membuat booking" })
    } finally {
      setIsLoading(false)
    }
  }

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
          ? { ...booking, status: newStatus, alasanPenolakan: alasan } as any
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

  const openModal = (booking: Booking) => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
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
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Booking Baru
            </Button>
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
          {isLoadingBookings ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat data booking...</p>
              </div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Tidak ada data booking yang ditemukan.</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow bg-white border border-gray-200">
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
            ))
          )}
        </div>

        {/* Detail Modal */}
        {isModalOpen && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
              <CardHeader className="bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-gray-900">Detail Peminjaman</CardTitle>
                    <CardDescription className="text-gray-600">Informasi lengkap peminjaman fasilitas</CardDescription>
                  </div>
                  <Button variant="ghost" onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 bg-white">
                {/* Booking Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-800">Nomor Booking</Label>
                      <p className="text-sm text-gray-900 font-medium">{selectedBooking.nomorBooking}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-800">Fasilitas</Label>
                      <p className="text-sm text-gray-900 font-medium">{selectedBooking.namaFasilitas}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-800">Tanggal</Label>
                      <p className="text-sm text-gray-900 font-medium">
                        {selectedBooking.tanggalMulai} - {selectedBooking.tanggalSelesai}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-800">Waktu</Label>
                      <p className="text-sm text-gray-900 font-medium">
                        {selectedBooking.waktuMulai} - {selectedBooking.waktuSelesai}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-800">Nama Peminjam</Label>
                      <p className="text-sm text-gray-900 font-medium">{selectedBooking.namaPeminjam}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-800">Email</Label>
                      <p className="text-sm text-gray-900 font-medium">{selectedBooking.emailPeminjam}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-800">Tipe Pengguna</Label>
                      <p className="text-sm text-gray-900 font-medium">{selectedBooking.tipePengguna}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-800">Tanggal Pengajuan</Label>
                      <p className="text-sm text-gray-900 font-medium">{selectedBooking.tanggalPengajuan}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-800">Keperluan</Label>
                  <p className="text-sm text-gray-900 font-medium mt-1">{selectedBooking.keperluan}</p>
                </div>
                
                {/* Dokumen untuk pengguna eksternal */}
                {selectedBooking.tipePengguna === "EKSTERNAL" && (selectedBooking as any).dokumenUrl && (
                  <div>
                    <Label className="text-sm font-medium text-gray-800">Dokumen</Label>
                    <div className="mt-1">
                      <a
                        href={(selectedBooking as any).dokumenUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Upload className="w-4 h-4" />
                        Lihat Dokumen PDF
                      </a>
                    </div>
                  </div>
                )}
                
                {selectedBooking.alasanPenolakan && (
                  <div>
                    <Label className="text-sm font-medium text-gray-800">Alasan Penolakan</Label>
                    <p className="text-sm text-red-600 font-medium mt-1">{selectedBooking.alasanPenolakan}</p>
                  </div>
                )}
                
                {/* Status Actions */}
                {selectedBooking.status === "PENDING" && (
                  <div className="border-t border-gray-200 pt-6">
                    <Label className="text-sm font-medium text-gray-800 mb-3 block">Aksi</Label>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleStatusUpdate(selectedBooking.id, "APPROVED")}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white"
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
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Tolak
                      </Button>
                    </div>
                  </div>
                )}
                
                {selectedBooking.status === "APPROVED" && (
                  <div className="border-t border-gray-200 pt-6">
                    <Label className="text-sm font-medium text-gray-800 mb-3 block">Aksi</Label>
                    <Button
                      onClick={() => handleStatusUpdate(selectedBooking.id, "COMPLETED")}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isLoading ? "Memproses..." : "Tandai Selesai"}
                    </Button>
                  </div>
                )}              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Booking Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Buat Booking Baru</h2>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* Alert Messages in Modal */}
                {message && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    message.type === "success" 
                      ? "bg-green-50 border border-green-200 text-green-800" 
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}>
                    {message.text}
                  </div>
                )}

                <form onSubmit={handleCreateBooking} className="space-y-4">
                  {/* Nama Peminjam */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Peminjam *
                    </label>
                    <input
                      type="text"
                      value={bookingForm.namaPeminjam}
                      onChange={(e) => handleFormChange('namaPeminjam', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Email Peminjam */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Peminjam *
                    </label>
                    <input
                      type="email"
                      value={bookingForm.emailPeminjam}
                      onChange={(e) => handleFormChange('emailPeminjam', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Tipe Pengguna */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipe Pengguna *
                    </label>
                    <select
                      value={bookingForm.tipePengguna}
                      onChange={(e) => handleFormChange('tipePengguna', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="MAHASISWA">Mahasiswa</option>
                      <option value="EKSTERNAL">Eksternal</option>
                    </select>
                  </div>

                  {/* Upload Dokumen untuk Eksternal */}
                  {bookingForm.tipePengguna === "EKSTERNAL" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Dokumen (PDF, maks 2MB) *
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileUpload}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={bookingForm.tipePengguna === "EKSTERNAL"}
                        />
                        <Upload className="w-5 h-5 text-gray-400" />
                      </div>
                      {bookingForm.dokumenFile && (
                        <p className="text-sm text-green-600 mt-1">
                          File terpilih: {bookingForm.dokumenFile.name}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Fasilitas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fasilitas *
                    </label>
                    <select
                      value={bookingForm.fasilitasId}
                      onChange={(e) => handleFormChange('fasilitasId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={isLoadingFacilities}
                    >
                      <option value="">Pilih Fasilitas</option>
                      {facilities.map((facility) => (
                        <option key={facility.id} value={facility.id}>
                          {facility.nama} - {facility.lokasi} (Kapasitas: {facility.kapasitas})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tanggal */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Mulai *
                      </label>
                      <input
                        type="date"
                        value={bookingForm.tanggalMulai}
                        onChange={(e) => handleFormChange('tanggalMulai', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Selesai *
                      </label>
                      <input
                        type="date"
                        value={bookingForm.tanggalSelesai}
                        onChange={(e) => handleFormChange('tanggalSelesai', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Jam */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jam Mulai *
                      </label>
                      <input
                        type="time"
                        value={bookingForm.jamMulai}
                        onChange={(e) => handleFormChange('jamMulai', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Jam Selesai *
                      </label>
                      <input
                        type="time"
                        value={bookingForm.jamSelesai}
                        onChange={(e) => handleFormChange('jamSelesai', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  {/* Tujuan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tujuan Peminjaman *
                    </label>
                    <input
                      type="text"
                      value={bookingForm.tujuan}
                      onChange={(e) => handleFormChange('tujuan', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Keterangan */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keterangan Tambahan
                    </label>
                    <textarea
                      value={bookingForm.keterangan}
                      onChange={(e) => handleFormChange('keterangan', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isLoading ? "Membuat..." : "Buat Booking"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}