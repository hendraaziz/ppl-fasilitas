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
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Building,
  MapPin,
  Users,
  Save,
  X
} from "lucide-react"

// Mock data for facilities
const mockFacilities = [
  {
    id: 1,
    nama: "Ruang Seminar A",
    lokasi: "Gedung A Lantai 2",
    kapasitas: 50,
    fasilitas: ["Proyektor", "AC", "Sound System", "WiFi"],
    status: "AKTIF",
    deskripsi: "Ruang seminar dengan fasilitas lengkap untuk acara formal"
  },
  {
    id: 2,
    nama: "Aula Utama",
    lokasi: "Gedung Utama Lantai 1",
    kapasitas: 200,
    fasilitas: ["Panggung", "Sound System", "Lighting", "AC", "WiFi"],
    status: "AKTIF",
    deskripsi: "Aula besar untuk acara skala besar"
  },
  {
    id: 3,
    nama: "Ruang Meeting B",
    lokasi: "Gedung B Lantai 3",
    kapasitas: 20,
    fasilitas: ["TV LED", "AC", "WiFi", "Whiteboard"],
    status: "MAINTENANCE",
    deskripsi: "Ruang meeting untuk diskusi tim kecil"
  },
  {
    id: 4,
    nama: "Lab Komputer 1",
    lokasi: "Gedung C Lantai 1",
    kapasitas: 30,
    fasilitas: ["30 PC", "Proyektor", "AC", "WiFi"],
    status: "AKTIF",
    deskripsi: "Laboratorium komputer untuk praktikum"
  }
]

export default function AdminFacilitiesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [facilities, setFacilities] = useState(mockFacilities)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingFacility, setEditingFacility] = useState<typeof mockFacilities[0] | null>(null)
  const [formData, setFormData] = useState({
    nama: "",
    lokasi: "",
    kapasitas: "",
    fasilitas: "",
    status: "AKTIF",
    deskripsi: ""
  })
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated" && session?.user?.role !== "PETUGAS") {
      router.push("/dashboard")
    }
  }, [status, session, router])

  const filteredFacilities = facilities.filter(facility =>
    facility.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    facility.lokasi.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const openModal = (facility?: typeof mockFacilities[0]) => {
    if (facility) {
      setEditingFacility(facility)
      setFormData({
        nama: facility.nama,
        lokasi: facility.lokasi,
        kapasitas: facility.kapasitas.toString(),
        fasilitas: facility.fasilitas.join(", "),
        status: facility.status,
        deskripsi: facility.deskripsi
      })
    } else {
      setEditingFacility(null)
      setFormData({
        nama: "",
        lokasi: "",
        kapasitas: "",
        fasilitas: "",
        status: "AKTIF",
        deskripsi: ""
      })
    }
    setIsModalOpen(true)
    setMessage(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingFacility(null)
    setMessage(null)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // TODO: Implement API call
      // const response = await fetch('/api/admin/facilities', {
      //   method: editingFacility ? 'PUT' : 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...formData,
      //     id: editingFacility?.id,
      //     kapasitas: parseInt(formData.kapasitas),
      //     fasilitas: formData.fasilitas.split(',').map(f => f.trim())
      //   })
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const facilityData = {
        id: editingFacility?.id || Date.now(),
        nama: formData.nama,
        lokasi: formData.lokasi,
        kapasitas: parseInt(formData.kapasitas),
        fasilitas: formData.fasilitas.split(',').map(f => f.trim()),
        status: formData.status,
        deskripsi: formData.deskripsi
      }
      
      if (editingFacility) {
        setFacilities(prev => prev.map(f => f.id === editingFacility.id ? facilityData : f))
        setMessage({ type: "success", text: "Fasilitas berhasil diperbarui" })
      } else {
        setFacilities(prev => [...prev, facilityData])
        setMessage({ type: "success", text: "Fasilitas berhasil ditambahkan" })
      }
      
      closeModal()
    } catch {
      setMessage({ type: "error", text: "Gagal menyimpan fasilitas" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (facilityId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus fasilitas ini?")) {
      return
    }

    try {
      // TODO: Implement API call
      // await fetch(`/api/admin/facilities/${facilityId}`, { method: 'DELETE' })
      
      setFacilities(prev => prev.filter(f => f.id !== facilityId))
      setMessage({ type: "success", text: "Fasilitas berhasil dihapus" })
    } catch {
      setMessage({ type: "error", text: "Gagal menghapus fasilitas" })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AKTIF":
        return "bg-green-100 text-green-800"
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800"
      case "NONAKTIF":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isFormValid = () => {
    return formData.nama && formData.lokasi && formData.kapasitas && formData.fasilitas
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
              <h1 className="text-3xl font-bold text-gray-900">Kelola Fasilitas</h1>
              <p className="text-gray-600 mt-2">Tambah, edit, dan kelola semua fasilitas</p>
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Fasilitas
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

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari fasilitas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((facility) => (
            <Card key={facility.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
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
                    getStatusColor(facility.status)
                  }`}>
                    {facility.status}
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
                  
                  {facility.deskripsi && (
                    <div>
                      <p className="text-sm text-gray-600">{facility.deskripsi}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModal(facility)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(facility.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {editingFacility ? "Edit Fasilitas" : "Tambah Fasilitas"}
                    </CardTitle>
                    <CardDescription>
                      {editingFacility ? "Perbarui informasi fasilitas" : "Tambahkan fasilitas baru"}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" onClick={closeModal}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nama">Nama Fasilitas</Label>
                    <Input
                      id="nama"
                      name="nama"
                      value={formData.nama}
                      onChange={handleInputChange}
                      placeholder="Masukkan nama fasilitas"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lokasi">Lokasi</Label>
                    <Input
                      id="lokasi"
                      name="lokasi"
                      value={formData.lokasi}
                      onChange={handleInputChange}
                      placeholder="Masukkan lokasi fasilitas"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kapasitas">Kapasitas</Label>
                    <Input
                      id="kapasitas"
                      name="kapasitas"
                      type="number"
                      value={formData.kapasitas}
                      onChange={handleInputChange}
                      placeholder="Masukkan kapasitas"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="AKTIF">Aktif</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="NONAKTIF">Non-aktif</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="fasilitas">Fasilitas</Label>
                  <Input
                    id="fasilitas"
                    name="fasilitas"
                    value={formData.fasilitas}
                    onChange={handleInputChange}
                    placeholder="Pisahkan dengan koma (contoh: Proyektor, AC, WiFi)"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <textarea
                    id="deskripsi"
                    name="deskripsi"
                    value={formData.deskripsi}
                    onChange={handleInputChange}
                    placeholder="Deskripsi fasilitas (opsional)"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={!isFormValid() || isLoading}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? "Menyimpan..." : (editingFacility ? "Perbarui" : "Simpan")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={closeModal}
                    disabled={isLoading}
                  >
                    Batal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}