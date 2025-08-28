"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Edit, Trash2, MapPin, Users, CheckCircle, XCircle } from "lucide-react"

interface Fasilitas {
  id: string
  nama: string
  deskripsi: string
  kapasitas: number
  lokasi: string
  tersedia: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminFacilitiesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [fasilitas, setFasilitas] = useState<Fasilitas[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nama: "",
    deskripsi: "",
    kapasitas: "",
    lokasi: "",
    tersedia: true
  })

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    // Check if user is admin/petugas
    if (session?.user?.role !== "PETUGAS") {
      router.push("/dashboard")
      return
    }

    loadFasilitas()
  }, [status, router, session])

  const loadFasilitas = async () => {
    try {
      const response = await fetch('/api/facilities?limit=100')
      const result = await response.json()
      
      if (result.success) {
        // Map API response to match component interface
        interface FacilityData {
          id: string
          nama: string
          deskripsi?: string
          kapasitas: number
          lokasi: string
          createdAt: string
          updatedAt: string
        }
        const mappedFasilitas = result.data.map((facility: FacilityData) => ({
          id: facility.id,
          nama: facility.nama,
          deskripsi: facility.deskripsi || '',
          kapasitas: facility.kapasitas,
          lokasi: facility.lokasi,
          tersedia: true, // Default to true, can be updated later
          createdAt: facility.createdAt,
          updatedAt: facility.updatedAt
        }))
        setFasilitas(mappedFasilitas)
      } else {
        console.error('Failed to load facilities:', result.error)
        alert('Gagal memuat data fasilitas: ' + result.error)
      }
    } catch (error) {
      console.error("Error loading facilities:", error)
      alert("Gagal memuat data fasilitas")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate form
      if (!formData.nama || !formData.deskripsi || !formData.kapasitas || !formData.lokasi) {
        alert("Mohon lengkapi semua field yang diperlukan")
        return
      }

      const facilityData = {
        nama: formData.nama,
        deskripsi: formData.deskripsi,
        kapasitas: parseInt(formData.kapasitas),
        lokasi: formData.lokasi,
        jenis: "Umum" // Default jenis, bisa disesuaikan
      }

      if (editingId) {
        // Update existing facility
        const response = await fetch(`/api/facilities/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(facilityData)
        })
        
        const result = await response.json()
        
        if (result.success) {
          alert("Fasilitas berhasil diperbarui!")
          await loadFasilitas() // Reload data from server
        } else {
          alert("Gagal memperbarui fasilitas: " + result.error)
          return
        }
      } else {
        // Add new facility
        const response = await fetch('/api/facilities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(facilityData)
        })
        
        const result = await response.json()
        
        if (result.success) {
          alert("Fasilitas berhasil ditambahkan!")
          await loadFasilitas() // Reload data from server
        } else {
          alert("Gagal menambahkan fasilitas: " + result.error)
          return
        }
      }

      // Reset form
      setFormData({
        nama: "",
        deskripsi: "",
        kapasitas: "",
        lokasi: "",
        tersedia: true
      })
      setShowAddForm(false)
      setEditingId(null)
    } catch (error) {
      console.error("Error saving facility:", error)
      alert("Gagal menyimpan fasilitas")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (facility: Fasilitas) => {
    setFormData({
      nama: facility.nama,
      deskripsi: facility.deskripsi,
      kapasitas: facility.kapasitas.toString(),
      lokasi: facility.lokasi,
      tersedia: facility.tersedia
    })
    setEditingId(facility.id)
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus fasilitas ini?")) {
      return
    }

    try {
      const response = await fetch(`/api/facilities/${id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert("Fasilitas berhasil dihapus!")
        await loadFasilitas() // Reload data from server
      } else {
        alert("Gagal menghapus fasilitas: " + result.error)
      }
    } catch (error) {
      console.error("Error deleting facility:", error)
      alert("Gagal menghapus fasilitas")
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      const facility = fasilitas.find(f => f.id === id)
      if (!facility) return

      const response = await fetch(`/api/facilities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tersedia: !facility.tersedia
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Update local state with the response data
        setFasilitas(prev => prev.map(f => 
          f.id === id 
            ? { ...f, tersedia: result.data.tersedia, updatedAt: result.data.updatedAt }
            : f
        ))
        alert(`Fasilitas berhasil ${!facility.tersedia ? 'diaktifkan' : 'dinonaktifkan'}!`)
      } else {
        alert("Gagal mengubah status fasilitas: " + result.error)
      }
    } catch (error) {
      console.error("Error toggling facility status:", error)
      alert("Gagal mengubah status fasilitas")
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCancelForm = () => {
    setFormData({
      nama: "",
      deskripsi: "",
      kapasitas: "",
      lokasi: "",
      tersedia: true
    })
    setShowAddForm(false)
    setEditingId(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800">Memuat halaman admin...</p>
        </div>
      </div>
    )
  }

  if (!session?.user || session.user.role !== "PETUGAS") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
          <p className="text-gray-600 mb-4">Anda tidak memiliki akses ke halaman ini.</p>
          <Button onClick={() => router.push("/dashboard")} className="bg-blue-600 hover:bg-blue-700 text-white">
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard")}
                className="mr-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kelola Fasilitas</h1>
                <p className="text-gray-600">Tambah, edit, dan kelola fasilitas</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4" />
              Tambah Fasilitas
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Fasilitas" : "Tambah Fasilitas Baru"}</CardTitle>
              <CardDescription>
                {editingId ? "Perbarui informasi fasilitas" : "Tambahkan fasilitas baru ke sistem"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nama">Nama Fasilitas *</Label>
                    <Input
                      id="nama"
                      value={formData.nama}
                      onChange={(e) => handleInputChange("nama", e.target.value)}
                      placeholder="Masukkan nama fasilitas"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lokasi">Lokasi *</Label>
                    <Input
                      id="lokasi"
                      value={formData.lokasi}
                      onChange={(e) => handleInputChange("lokasi", e.target.value)}
                      placeholder="Masukkan lokasi fasilitas"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="deskripsi">Deskripsi *</Label>
                  <textarea
                    id="deskripsi"
                    value={formData.deskripsi}
                    onChange={(e) => handleInputChange("deskripsi", e.target.value)}
                    placeholder="Masukkan deskripsi fasilitas"
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kapasitas">Kapasitas *</Label>
                    <Input
                      id="kapasitas"
                      type="number"
                      value={formData.kapasitas}
                      onChange={(e) => handleInputChange("kapasitas", e.target.value)}
                      placeholder="Masukkan kapasitas"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="tersedia">Status</Label>
                    <select
                      id="tersedia"
                      value={formData.tersedia.toString()}
                      onChange={(e) => handleInputChange("tersedia", e.target.value === "true")}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="true">Tersedia</option>
                      <option value="false">Tidak Tersedia</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelForm}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? "Menyimpan..." : (editingId ? "Perbarui" : "Tambah")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Facilities List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Daftar Fasilitas ({fasilitas.length})
            </h2>
          </div>

          {fasilitas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada fasilitas</h3>
                <p className="text-gray-500 mb-4">Tambahkan fasilitas pertama untuk memulai</p>
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Tambah Fasilitas
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fasilitas.map((facility) => (
                <Card key={facility.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{facility.nama}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4" />
                          {facility.lokasi}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-1">
                        {facility.tersedia ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">{facility.deskripsi}</p>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users className="h-4 w-4" />
                        <span>Kapasitas: {facility.kapasitas} orang</span>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        <p>Dibuat: {formatDate(facility.createdAt)}</p>
                        {facility.updatedAt !== facility.createdAt && (
                          <p>Diperbarui: {formatDate(facility.updatedAt)}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(facility)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant={facility.tersedia ? "outline" : "default"}
                          onClick={() => handleToggleStatus(facility.id)}
                          className={facility.tersedia ? "" : "bg-green-600 hover:bg-green-700 text-white"}
                        >
                          {facility.tersedia ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(facility.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}