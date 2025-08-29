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
  MapPin, 
  Users, 
  Search,
  Filter,
  Building,
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
  createdAt: string
  updatedAt: string
}

export default function BookingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(true)
  const [bookingForm, setBookingForm] = useState({
    tanggalMulai: "",
    tanggalSelesai: "",
    jamMulai: "",
    jamSelesai: "",
    tujuan: "",
    jumlahPeserta: "",
    keterangan: "",
    tipePengguna: "MAHASISWA" as "MAHASISWA" | "EKSTERNAL",
    dokumenFile: null as File | null
  })
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchFacilities()
    }
  }, [status, router])

  const filteredFacilities = facilities.filter(facility =>
    facility.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facility.lokasi.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setBookingForm(prev => ({ ...prev, [name]: value }))
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
      setBookingForm(prev => ({ ...prev, dokumenFile: file }))
    }
  }

  const handleBooking = async () => {
    if (!selectedFacility) return

    setIsLoading(true)
    setMessage(null)

    try {
      // Combine date and time for API
      const tglMulai = new Date(`${bookingForm.tanggalMulai}T${bookingForm.jamMulai}:00`).toISOString()
      const tglSelesai = new Date(`${bookingForm.tanggalSelesai}T${bookingForm.jamSelesai}:00`).toISOString()

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fasilitasId: selectedFacility.id,
          tglMulai,
          tglSelesai,
          tujuan: bookingForm.tujuan,
          keterangan: bookingForm.keterangan,
          userId: session?.user?.id // Add userId from session
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ 
          type: "success", 
          text: `Booking ${selectedFacility.nama} berhasil diajukan. Menunggu persetujuan petugas.` 
        })
        
        // Reset form
        setSelectedFacility(null)
        setBookingForm({
          tanggalMulai: "",
          tanggalSelesai: "",
          jamMulai: "",
          jamSelesai: "",
          tujuan: "",
          jumlahPeserta: "",
          keterangan: "",
          tipePengguna: "MAHASISWA",
          dokumenFile: null
        })
      } else {
        setMessage({ type: "error", text: result.error || "Gagal mengajukan booking" })
      }
    } catch (error) {
      console.error('Booking error:', error)
      setMessage({ type: "error", text: "Gagal mengajukan booking" })
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = () => {
    const basicValidation = bookingForm.tanggalMulai && 
                           bookingForm.tanggalSelesai && 
                           bookingForm.jamMulai && 
                           bookingForm.jamSelesai && 
                           bookingForm.tujuan && 
                           bookingForm.jumlahPeserta
    
    // For external users, document is required
    if (bookingForm.tipePengguna === "EKSTERNAL") {
      return basicValidation && bookingForm.dokumenFile !== null
    }
    
    return basicValidation
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
          <h1 className="text-3xl font-bold text-gray-900">Booking Fasilitas</h1>
          <p className="text-gray-600 mt-2">Pilih dan booking fasilitas yang Anda butuhkan</p>
        </div>

        {/* Alert Messages */}
        {message && (
          <Alert className={`mb-6 ${message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Facilities List */}
          <div className="lg:col-span-2">
            {/* Search and Filter */}
            <div className="mb-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari fasilitas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            {/* Facilities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isLoadingFacilities ? (
                <div className="col-span-2 text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Memuat fasilitas...</p>
                </div>
              ) : filteredFacilities.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Tidak ada fasilitas yang tersedia</p>
                </div>
              ) : (
                filteredFacilities.map((facility: Facility) => (
                <Card 
                  key={facility.id} 
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedFacility?.id === facility.id ? "ring-2 ring-blue-500" : ""
                  } ${!facility.tersedia ? "opacity-60" : ""}`}
                  onClick={() => facility.tersedia && setSelectedFacility(facility)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center">
                          <Building className="h-5 w-5 mr-2" />
                          {facility.nama}
                        </CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          {facility.lokasi}
                        </CardDescription>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        facility.tersedia 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {facility.tersedia ? "Tersedia" : "Tidak Tersedia"}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        Kapasitas: {facility.kapasitas} orang
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Jenis:</p>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {facility.jenis}
                        </span>
                        {facility.deskripsi && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">{facility.deskripsi}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </div>

          {/* Booking Form */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Form Booking</CardTitle>
                <CardDescription>
                  {selectedFacility 
                    ? `Booking untuk ${selectedFacility.nama}`
                    : "Pilih fasilitas terlebih dahulu"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedFacility ? (
                  <div className="space-y-4">
                    {/* Selected Facility Info */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">{selectedFacility.nama}</h4>
                      <p className="text-sm text-blue-700">{selectedFacility.lokasi}</p>
                      <p className="text-sm text-blue-700">Kapasitas: {selectedFacility.kapasitas} orang</p>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="tanggalMulai">Tanggal Mulai</Label>
                        <Input
                          id="tanggalMulai"
                          name="tanggalMulai"
                          type="date"
                          value={bookingForm.tanggalMulai}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tanggalSelesai">Tanggal Selesai</Label>
                        <Input
                          id="tanggalSelesai"
                          name="tanggalSelesai"
                          type="date"
                          value={bookingForm.tanggalSelesai}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="jamMulai">Jam Mulai</Label>
                        <Input
                          id="jamMulai"
                          name="jamMulai"
                          type="time"
                          value={bookingForm.jamMulai}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="jamSelesai">Jam Selesai</Label>
                        <Input
                          id="jamSelesai"
                          name="jamSelesai"
                          type="time"
                          value={bookingForm.jamSelesai}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Purpose and Participants */}
                    <div>
                      <Label htmlFor="tujuan">Tujuan Penggunaan</Label>
                      <Input
                        id="tujuan"
                        name="tujuan"
                        value={bookingForm.tujuan}
                        onChange={handleInputChange}
                        placeholder="Contoh: Seminar, Meeting, Workshop"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="jumlahPeserta">Jumlah Peserta</Label>
                      <Input
                        id="jumlahPeserta"
                        name="jumlahPeserta"
                        type="number"
                        value={bookingForm.jumlahPeserta}
                        onChange={handleInputChange}
                        placeholder="Masukkan jumlah peserta"
                        max={selectedFacility.kapasitas}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="keterangan">Keterangan Tambahan</Label>
                      <textarea
                        id="keterangan"
                        name="keterangan"
                        value={bookingForm.keterangan}
                        onChange={handleInputChange}
                        placeholder="Keterangan tambahan (opsional)"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>

                    {/* Tipe Pengguna */}
                    <div>
                      <Label htmlFor="tipePengguna">Tipe Pengguna</Label>
                      <select
                        id="tipePengguna"
                        name="tipePengguna"
                        value={bookingForm.tipePengguna}
                        onChange={handleInputChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="MAHASISWA">Mahasiswa</option>
                        <option value="EKSTERNAL">Eksternal</option>
                      </select>
                    </div>

                    {/* Upload Dokumen untuk Eksternal */}
                    {bookingForm.tipePengguna === "EKSTERNAL" && (
                      <div>
                        <Label htmlFor="dokumenFile">Upload Dokumen (PDF, maks 2MB) *</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            id="dokumenFile"
                            type="file"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required={bookingForm.tipePengguna === "EKSTERNAL"}
                          />
                          <Upload className="w-5 h-5 text-gray-400" />
                        </div>
                        {bookingForm.dokumenFile && (
                          <p className="text-sm text-green-600 mt-1">
                            File terpilih: {bookingForm.dokumenFile.name}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Wajib upload dokumen identitas atau surat keterangan untuk pengguna eksternal
                        </p>
                      </div>
                    )}

                    <Button 
                      onClick={handleBooking}
                      disabled={!isFormValid() || isLoading}
                      className="w-full"
                    >
                      {isLoading ? "Memproses..." : "Ajukan Booking"}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Pilih fasilitas untuk memulai booking</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}