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
  Building
} from "lucide-react"

// Mock data for facilities
const mockFacilities = [
  {
    id: 1,
    nama: "Ruang Seminar A",
    lokasi: "Gedung A Lantai 2",
    kapasitas: 50,
    fasilitas: ["Proyektor", "AC", "Sound System", "WiFi"],
    tersedia: true,
    gambar: "/api/placeholder/300/200"
  },
  {
    id: 2,
    nama: "Aula Utama",
    lokasi: "Gedung Utama Lantai 1",
    kapasitas: 200,
    fasilitas: ["Panggung", "Sound System", "Lighting", "AC", "WiFi"],
    tersedia: true,
    gambar: "/api/placeholder/300/200"
  },
  {
    id: 3,
    nama: "Ruang Meeting B",
    lokasi: "Gedung B Lantai 3",
    kapasitas: 20,
    fasilitas: ["TV LED", "AC", "WiFi", "Whiteboard"],
    tersedia: false,
    gambar: "/api/placeholder/300/200"
  },
  {
    id: 4,
    nama: "Lab Komputer 1",
    lokasi: "Gedung C Lantai 1",
    kapasitas: 30,
    fasilitas: ["30 PC", "Proyektor", "AC", "WiFi"],
    tersedia: true,
    gambar: "/api/placeholder/300/200"
  }
]

export default function BookingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [facilities] = useState(mockFacilities)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFacility, setSelectedFacility] = useState<typeof mockFacilities[0] | null>(null)
  const [bookingForm, setBookingForm] = useState({
    tanggalMulai: "",
    tanggalSelesai: "",
    jamMulai: "",
    jamSelesai: "",
    tujuan: "",
    jumlahPeserta: "",
    keterangan: ""
  })
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  const filteredFacilities = facilities.filter(facility =>
    facility.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facility.lokasi.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBookingForm(prev => ({ ...prev, [name]: value }))
  }

  const handleBooking = async () => {
    if (!selectedFacility) return

    setIsLoading(true)
    setMessage(null)

    try {
      // TODO: Implement API call to create booking
      // const response = await fetch('/api/bookings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     fasilitasId: selectedFacility.id,
      //     ...bookingForm
      //   })
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
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
        keterangan: ""
      })
    } catch {
      setMessage({ type: "error", text: "Gagal mengajukan booking" })
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = () => {
    return bookingForm.tanggalMulai && 
           bookingForm.tanggalSelesai && 
           bookingForm.jamMulai && 
           bookingForm.jamSelesai && 
           bookingForm.tujuan && 
           bookingForm.jumlahPeserta
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
              {filteredFacilities.map((facility) => (
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
                        <p className="text-sm font-medium text-gray-700 mb-2">Fasilitas:</p>
                        <div className="flex flex-wrap gap-1">
                          {facility.fasilitas.map((item, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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