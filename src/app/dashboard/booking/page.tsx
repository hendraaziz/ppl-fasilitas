"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Calendar, MapPin, CheckCircle, AlertCircle } from "lucide-react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import "@/styles/datepicker.css"

interface Fasilitas {
  id: string
  nama: string
  deskripsi?: string
  kapasitas: number
  lokasi: string
  jenis: string
  createdAt: string
  updatedAt: string
}

export default function BookingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [fasilitas, setFasilitas] = useState<Fasilitas[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fasilitasId: "",
    tanggalMulai: null as Date | null,
    tanggalSelesai: null as Date | null,
    jamMulai: "",
    jamSelesai: "",
    keperluan: "",
    jumlahPeserta: ""
  })
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    loadFasilitas()
  }, [status, router])

  // Real-time validation when form data changes
  useEffect(() => {
    if (formData.jamMulai || formData.jamSelesai || formData.tanggalMulai || formData.tanggalSelesai) {
      const newErrors: Record<string, string> = { ...errors }
      
      // Clear previous time-related errors
      delete newErrors.jamSelesai
      delete newErrors.tanggalSelesai
      
      // Validate times if both are selected
      if (formData.jamMulai && formData.jamSelesai) {
        const [startHour, startMinute] = formData.jamMulai.split(':').map(Number)
        const [endHour, endMinute] = formData.jamSelesai.split(':').map(Number)
        
        const startTimeInMinutes = startHour * 60 + startMinute
        const endTimeInMinutes = endHour * 60 + endMinute
        
        // If same date, end time must be after start time
        if (formData.tanggalMulai && formData.tanggalSelesai && 
            formData.tanggalMulai.toDateString() === formData.tanggalSelesai.toDateString()) {
          if (endTimeInMinutes <= startTimeInMinutes) {
            newErrors.jamSelesai = 'Jam selesai harus lebih besar dari jam mulai pada hari yang sama'
          } else if (endTimeInMinutes - startTimeInMinutes < 60) {
            newErrors.jamSelesai = 'Durasi booking minimal 1 jam'
          }
        }
      }
      
      // Validate date range
      if (formData.tanggalMulai && formData.tanggalSelesai && 
          formData.tanggalMulai.toDateString() !== formData.tanggalSelesai.toDateString()) {
        const daysDiff = Math.ceil((formData.tanggalSelesai.getTime() - formData.tanggalMulai.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff > 7) {
          newErrors.tanggalSelesai = 'Booking tidak boleh lebih dari 7 hari'
        }
      }
      
      setErrors(newErrors)
    }
  }, [formData.jamMulai, formData.jamSelesai, formData.tanggalMulai, formData.tanggalSelesai])

  const loadFasilitas = async () => {
    try {
      // Use a large limit to get all facilities for dropdown
      const response = await fetch('/api/facilities?limit=100')
      const result = await response.json()
      
      if (result.success) {
        setFasilitas(result.data)
      } else {
        setMessage({ type: 'error', text: 'Gagal memuat data fasilitas' })
      }
    } catch (error) {
      console.error("Error loading facilities:", error)
      setMessage({ type: 'error', text: 'Gagal memuat data fasilitas' })
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.fasilitasId) newErrors.fasilitasId = 'Fasilitas harus dipilih'
    if (!formData.tanggalMulai) newErrors.tanggalMulai = 'Tanggal mulai harus diisi'
    if (!formData.tanggalSelesai) newErrors.tanggalSelesai = 'Tanggal selesai harus diisi'
    if (!formData.jamMulai) newErrors.jamMulai = 'Jam mulai harus diisi'
    if (!formData.jamSelesai) newErrors.jamSelesai = 'Jam selesai harus diisi'
    if (!formData.keperluan) newErrors.keperluan = 'Keperluan harus diisi'
    
    // Validate dates
    if (formData.tanggalMulai && formData.tanggalSelesai) {
      if (formData.tanggalSelesai < formData.tanggalMulai) {
        newErrors.tanggalSelesai = 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai'
      }
    }
    
    // Validate times
    if (formData.jamMulai && formData.jamSelesai) {
      const [startHour, startMinute] = formData.jamMulai.split(':').map(Number)
      const [endHour, endMinute] = formData.jamSelesai.split(':').map(Number)
      
      const startTimeInMinutes = startHour * 60 + startMinute
      const endTimeInMinutes = endHour * 60 + endMinute
      
      // If same date, end time must be after start time
      if (formData.tanggalMulai && formData.tanggalSelesai && 
          formData.tanggalMulai.toDateString() === formData.tanggalSelesai.toDateString()) {
        if (endTimeInMinutes <= startTimeInMinutes) {
          newErrors.jamSelesai = 'Jam selesai harus lebih besar dari jam mulai pada hari yang sama'
        }
        
        // Minimum booking duration of 1 hour
        if (endTimeInMinutes - startTimeInMinutes < 60) {
          newErrors.jamSelesai = 'Durasi booking minimal 1 jam'
        }
      }
      
      // If different dates, validate that it's not spanning too long
      if (formData.tanggalMulai && formData.tanggalSelesai && 
          formData.tanggalMulai.toDateString() !== formData.tanggalSelesai.toDateString()) {
        const daysDiff = Math.ceil((formData.tanggalSelesai.getTime() - formData.tanggalMulai.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff > 7) {
          newErrors.tanggalSelesai = 'Booking tidak boleh lebih dari 7 hari'
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMessage(null)
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)

    try {
      // Combine date and time for API
      if (!formData.tanggalMulai || !formData.tanggalSelesai) {
        throw new Error('Tanggal tidak valid')
      }
      
      const startDate = new Date(formData.tanggalMulai)
      const endDate = new Date(formData.tanggalSelesai)
      
      // Set time
      const [startHour, startMinute] = formData.jamMulai.split(':')
      const [endHour, endMinute] = formData.jamSelesai.split(':')
      
      startDate.setHours(parseInt(startHour), parseInt(startMinute), 0, 0)
      endDate.setHours(parseInt(endHour), parseInt(endMinute), 0, 0)
      
      const tglMulai = startDate.toISOString()
      const tglSelesai = endDate.toISOString()
      
      const bookingData = {
        fasilitasId: formData.fasilitasId,
        tglMulai,
        tglSelesai,
        tujuan: formData.keperluan,
        keterangan: formData.jumlahPeserta ? `Jumlah peserta: ${formData.jumlahPeserta}` : undefined
      }
      
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Booking berhasil diajukan! Menunggu persetujuan admin.' })
        // Reset form
        setFormData({
          fasilitasId: "",
          tanggalMulai: null,
          tanggalSelesai: null,
          jamMulai: "",
          jamSelesai: "",
          keperluan: "",
          jumlahPeserta: ""
        })
        setErrors({})
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        // Handle conflict errors with detailed information
        if (response.status === 409 && result.conflicts) {
          interface Conflict {
            peminjam: string
            tujuan: string
            tglMulai: string
            tglSelesai: string
          }
          const conflictMessage = `${result.error}\n\nBooking yang konflik:\n${result.conflicts.map((conflict: Conflict) => 
            `• ${conflict.peminjam} - ${conflict.tujuan}\n  ${new Date(conflict.tglMulai).toLocaleDateString('id-ID')} ${new Date(conflict.tglMulai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - ${new Date(conflict.tglSelesai).toLocaleDateString('id-ID')} ${new Date(conflict.tglSelesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
          ).join('\n')}`
          setMessage({ type: 'error', text: conflictMessage })
        } else {
          setMessage({ type: 'error', text: result.error || 'Gagal membuat booking' })
        }
      }
    } catch (error) {
      console.error("Error creating booking:", error)
      setMessage({ type: 'error', text: 'Gagal membuat booking' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | Date | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800">Memuat halaman booking...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Booking Fasilitas</h1>
              <p className="text-gray-600">Ajukan peminjaman fasilitas baru</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg border-2 flex items-start gap-3 mb-6 ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-300 text-green-900' 
              : 'bg-red-50 border-red-300 text-red-900'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-6 w-6 text-green-700 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-700 flex-shrink-0 mt-0.5" />
            )}
            <div className="font-semibold text-sm leading-relaxed whitespace-pre-line">{message.text}</div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pilih Fasilitas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold mb-2 text-gray-900">
                <MapPin className="h-5 w-5" />
                Pilih Fasilitas
              </CardTitle>
              <CardDescription className="text-gray-800">
                Pilih fasilitas yang ingin Anda booking
              </CardDescription >
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fasilitas" className="text-sm font-semibold text-gray-800 mb-2 block">Fasilitas *</Label>
                <select 
                  id="fasilitas"
                  value={formData.fasilitasId} 
                  onChange={(e) => handleInputChange("fasilitasId", e.target.value)}
                  className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 font-medium ${
                    errors.fasilitasId ? 'border-red-400 bg-red-50' : 'border-gray-400'
                  }`}
                >
                  <option value="" className="text-gray-500">Pilih fasilitas</option>
                  {fasilitas.map((facility) => (
                    <option key={facility.id} value={facility.id} className="text-gray-900">
                      {facility.nama} - {facility.lokasi} (Kapasitas: {facility.kapasitas})
                    </option>
                  ))}
                </select>
                {errors.fasilitasId && (
                  <p className="mt-2 text-sm text-red-700 font-medium">{errors.fasilitasId}</p>
                )}
              </div>
              
              {formData.fasilitasId && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  {(() => {
                    const selectedFacility = fasilitas.find(f => f.id === formData.fasilitasId)
                    return selectedFacility ? (
                      <div>
                        <h4 className="font-semibold text-blue-900 text-base">{selectedFacility.nama}</h4>
                        <p className="text-blue-800 mt-1 text-sm leading-relaxed">{selectedFacility.deskripsi}</p>
                        <p className="text-blue-800 mt-2 text-sm font-medium">
                          📍 {selectedFacility.lokasi} • 👥 Kapasitas: {selectedFacility.kapasitas} orang
                        </p>
                      </div>
                    ) : null
                  })()
                  }
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waktu Booking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold mb-2 text-gray-900">
                <Calendar className="h-5 w-5" />
                Waktu Booking
              </CardTitle>
              <CardDescription className="text-gray-800">
                Tentukan tanggal dan jam peminjaman
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tanggalMulai" className="text-sm font-semibold text-gray-800 mb-2 block">Tanggal Mulai *</Label>
                  <DatePicker
                    selected={formData.tanggalMulai}
                    onChange={(date) => handleInputChange("tanggalMulai", date)}
                    dateFormat="dd/MM/yyyy"
                    minDate={new Date()}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none mt-1 text-gray-900 ${errors.tanggalMulai ? 'border-red-400 bg-red-50' : 'border-gray-400'}`}
                    placeholderText="Pilih tanggal mulai"
                  />
                  {errors.tanggalMulai && (
                    <p className="mt-2 text-sm text-red-700 font-medium">{errors.tanggalMulai}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="tanggalSelesai" className="text-sm font-semibold text-gray-800 mb-2 block">Tanggal Selesai *</Label>
                  <DatePicker
                    selected={formData.tanggalSelesai}
                    onChange={(date) => handleInputChange("tanggalSelesai", date)}
                    dateFormat="dd/MM/yyyy"
                    minDate={formData.tanggalMulai || new Date()}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none mt-1 text-gray-900 ${errors.tanggalSelesai ? 'border-red-400 bg-red-50' : 'border-gray-400'}`}
                    placeholderText="Pilih tanggal selesai"
                  />
                  {errors.tanggalSelesai && (
                    <p className="mt-2 text-sm text-red-700 font-medium">{errors.tanggalSelesai}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jamMulai" className="text-sm font-semibold text-gray-800 mb-2 block">Jam Mulai *</Label>
                  <select
                    id="jamMulai"
                    value={formData.jamMulai}
                    onChange={(e) => handleInputChange("jamMulai", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none mt-1 text-gray-900 ${errors.jamMulai ? 'border-red-400 bg-red-50' : 'border-gray-400'}`}
                  >
                    <option value="">Pilih jam mulai</option>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0')
                      return (
                        <option key={`${hour}:00`} value={`${hour}:00`}>{hour}:00</option>
                      )
                    })}
                  </select>
                  {errors.jamMulai && (
                    <p className="mt-2 text-sm text-red-700 font-medium">{errors.jamMulai}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="jamSelesai" className="text-sm font-semibold text-gray-800 mb-2 block">Jam Selesai *</Label>
                  <select
                    id="jamSelesai"
                    value={formData.jamSelesai}
                    onChange={(e) => handleInputChange("jamSelesai", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none mt-1 text-gray-900 ${errors.jamSelesai ? 'border-red-400 bg-red-50' : 'border-gray-400'}`}
                  >
                    <option value="">Pilih jam selesai</option>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0')
                      return (
                        <option key={`${hour}:00`} value={`${hour}:00`}>{hour}:00</option>
                      )
                    })}
                  </select>
                  {errors.jamSelesai && (
                    <p className="mt-2 text-sm text-red-700 font-medium">{errors.jamSelesai}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detail Booking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold mb-2 text-gray-900">Detail Booking</CardTitle>
              <CardDescription className="text-gray-800">
                Informasi tambahan tentang peminjaman
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="keperluan" className="text-sm font-semibold text-gray-800 mb-2 block">Keperluan/Tujuan Peminjaman *</Label>
                <textarea
                  id="keperluan"
                  placeholder="Jelaskan keperluan atau tujuan peminjaman fasilitas..."
                  value={formData.keperluan}
                  onChange={(e) => handleInputChange("keperluan", e.target.value)}
                  rows={4}
                  className={`w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors mt-1 text-gray-900 placeholder-gray-500 ${
                    errors.keperluan ? 'border-red-400 bg-red-50' : 'border-gray-400'
                  }`}
                />
                {errors.keperluan && (
                  <p className="mt-2 text-sm text-red-700 font-medium">{errors.keperluan}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="jumlahPeserta" className="text-sm font-semibold text-gray-800 mb-2 block">Perkiraan Jumlah Peserta</Label>
                <Input
                  id="jumlahPeserta"
                  type="number"
                  placeholder="Masukkan jumlah peserta"
                  value={formData.jumlahPeserta}
                  onChange={(e) => handleInputChange("jumlahPeserta", e.target.value)}
                  min="1"
                  className={`mt-1 text-gray-900 placeholder-gray-500 ${errors.jumlahPeserta ? 'border-red-400 bg-red-50' : 'border-gray-400'}`}
                />
                {errors.jumlahPeserta && (
                  <p className="mt-2 text-sm text-red-700 font-medium">{errors.jumlahPeserta}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => {
                setFormData({
                  fasilitasId: '',
                  tanggalMulai: null,
                  tanggalSelesai: null,
                  jamMulai: '',
                  jamSelesai: '',
                  keperluan: '',
                  jumlahPeserta: ''
                });
                setErrors({});
                setMessage(null);
              }}
              className="px-6 py-3 text-gray-700 border-gray-400 hover:bg-gray-50 hover:border-gray-500 font-medium"
            >
              Reset Form
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold shadow-md hover:shadow-lg transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="font-medium">Memproses...</span>
                </>
              ) : (
                'Ajukan Booking'
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}