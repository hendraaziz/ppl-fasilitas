"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, User, Mail, Phone, Calendar, Edit, Save, X } from "lucide-react"

interface UserProfile {
  id: string
  nama: string
  email: string
  nim?: string
  nip?: string
  telepon?: string
  alamat?: string
  tanggalLahir?: string
  role: string
  tipePengguna: string
  createdAt: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nama: "",
    telepon: "",
    alamat: "",
    tanggalLahir: ""
  })

  useEffect(() => {
    if (status === "loading") return
    
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    loadProfile()
  }, [status, router])

  const loadProfile = async () => {
    try {
      if (!session?.user?.id) return
      
      const response = await fetch(`/api/users/${session.user.id}`)
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal memuat profil')
      }
      
      const userData = result.data
      const userProfile: UserProfile = {
        id: userData.id,
        nama: userData.nama,
        email: userData.email,
        nim: session?.user?.role === "MAHASISWA" ? "2021001001" : undefined,
        nip: session?.user?.role === "PETUGAS" ? "198501012010011001" : undefined,
        telepon: userData.telepon || "",
        alamat: userData.alamat || "",
        tanggalLahir: userData.tanggalLahir ? userData.tanggalLahir.split('T')[0] : "",
        role: userData.role,
        tipePengguna: userData.tipePengguna,
        createdAt: userData.createdAt
      }
      
      setProfile(userProfile)
      setFormData({
        nama: userProfile.nama,
        telepon: userProfile.telepon || "",
        alamat: userProfile.alamat || "",
        tanggalLahir: userProfile.tanggalLahir || ""
      })
    } catch (error) {
      console.error("Error loading profile:", error)
      alert("Gagal memuat data profil")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!session?.user?.id) {
        throw new Error('User ID tidak ditemukan')
      }
      
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nama: formData.nama,
          telepon: formData.telepon || null,
          alamat: formData.alamat || null,
          tanggalLahir: formData.tanggalLahir || null
        })
      })
      
      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Gagal memperbarui profil')
      }
      
      // Update local state with the response data
      if (profile) {
        setProfile({
          ...profile,
          nama: result.data.nama,
          telepon: result.data.telepon || "",
          alamat: result.data.alamat || "",
          tanggalLahir: result.data.tanggalLahir ? result.data.tanggalLahir.split('T')[0] : ""
        })
      }
      
      alert("Profil berhasil diperbarui!")
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      alert(error instanceof Error ? error.message : "Gagal memperbarui profil")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCancelEdit = () => {
    if (profile) {
      setFormData({
        nama: profile.nama,
        telepon: profile.telepon || "",
        alamat: profile.alamat || "",
        tanggalLahir: profile.tanggalLahir || ""
      })
    }
    setIsEditing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'MAHASISWA': return 'Mahasiswa'
      case 'PETUGAS': return 'Petugas/Admin'
      case 'EKSTERNAL': return 'Pengguna Eksternal'
      default: return role
    }
  }

  const getTipeLabel = (tipe: string) => {
    switch (tipe) {
      case 'INTERNAL': return 'Internal'
      case 'EKSTERNAL': return 'Eksternal'
      default: return tipe
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800">Memuat profil...</p>
        </div>
      </div>
    )
  }

  if (!session?.user || !profile) {
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
              <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
              <p className="text-gray-600">Kelola informasi profil Anda</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{profile.nama}</CardTitle>
                    <CardDescription className="text-base">
                      {getRoleLabel(profile.role)} • {getTipeLabel(profile.tipePengguna)}
                    </CardDescription>
                  </div>
                </div>
                {!isEditing && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Profil
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pribadi</CardTitle>
              <CardDescription>
                {isEditing ? "Edit informasi pribadi Anda" : "Informasi pribadi Anda"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nama">Nama Lengkap *</Label>
                      <Input
                        id="nama"
                        value={formData.nama}
                        onChange={(e) => handleInputChange("nama", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={profile.email}
                        disabled
                        className="bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.nim && (
                      <div>
                        <Label htmlFor="nim">NIM</Label>
                        <Input
                          id="nim"
                          value={profile.nim}
                          disabled
                          className="bg-gray-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">NIM tidak dapat diubah</p>
                      </div>
                    )}
                    {profile.nip && (
                      <div>
                        <Label htmlFor="nip">NIP</Label>
                        <Input
                          id="nip"
                          value={profile.nip}
                          disabled
                          className="bg-gray-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">NIP tidak dapat diubah</p>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="telepon">Nomor Telepon</Label>
                      <Input
                        id="telepon"
                        value={formData.telepon}
                        onChange={(e) => handleInputChange("telepon", e.target.value)}
                        placeholder="+62 xxx-xxxx-xxxx"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="alamat">Alamat</Label>
                    <textarea
                      id="alamat"
                      value={formData.alamat}
                      onChange={(e) => handleInputChange("alamat", e.target.value)}
                      placeholder="Masukkan alamat lengkap"
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                    <Input
                      id="tanggalLahir"
                      type="date"
                      value={formData.tanggalLahir}
                      onChange={(e) => handleInputChange("tanggalLahir", e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="h-4 w-4" />
                      {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Email</p>
                          <p className="text-sm text-gray-600">{profile.email}</p>
                        </div>
                      </div>
                      
                      {profile.nim && (
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">NIM</p>
                            <p className="text-sm text-gray-600">{profile.nim}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile.nip && (
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">NIP</p>
                            <p className="text-sm text-gray-600">{profile.nip}</p>
                          </div>
                        </div>
                      )}
                      
                      {profile.telepon && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Telepon</p>
                            <p className="text-sm text-gray-600">{profile.telepon}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {profile.tanggalLahir && (
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Tanggal Lahir</p>
                            <p className="text-sm text-gray-600">{formatDate(profile.tanggalLahir)}</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Bergabung Sejak</p>
                          <p className="text-sm text-gray-600">{formatDate(profile.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {profile.alamat && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium text-gray-900 mb-2">Alamat</p>
                      <p className="text-sm text-gray-600">{profile.alamat}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}