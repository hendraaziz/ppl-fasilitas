"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Mail, Shield, Calendar, ArrowLeft, Edit, Save, X } from "lucide-react"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    noTelepon: "",
    alamat: ""
  })
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      setFormData({
        nama: session.user.name || "",
        email: session.user.email || "",
        noTelepon: "", // Will be loaded from API
        alamat: "" // Will be loaded from API
      })
    }
  }, [session])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // TODO: Implement API call to update profile
      // const response = await fetch('/api/profile', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setMessage({ type: "success", text: "Profil berhasil diperbarui" })
      setIsEditing(false)
    } catch {
      setMessage({ type: "error", text: "Gagal memperbarui profil" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form data
    if (session?.user) {
      setFormData({
        nama: session.user.name || "",
        email: session.user.email || "",
        noTelepon: "",
        alamat: ""
      })
    }
    setIsEditing(false)
    setMessage(null)
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "MAHASISWA":
        return "Mahasiswa"
      case "PETUGAS":
        return "Petugas"
      case "EKSTERNAL":
        return "Pengguna Eksternal"
      default:
        return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "MAHASISWA":
        return "bg-blue-100 text-blue-800"
      case "PETUGAS":
        return "bg-green-100 text-green-800"
      case "EKSTERNAL":
        return "bg-purple-100 text-purple-800"
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

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <h1 className="text-3xl font-bold text-gray-900">Profil Pengguna</h1>
          <p className="text-gray-600 mt-2">Kelola informasi profil Anda</p>
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
          {/* Profile Info Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Informasi Profil
                    </CardTitle>
                    <CardDescription>
                      Informasi dasar tentang akun Anda
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={isLoading}>
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? "Menyimpan..." : "Simpan"}
                      </Button>
                      <Button onClick={handleCancel} variant="outline" disabled={isLoading}>
                        <X className="h-4 w-4 mr-2" />
                        Batal
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    {isEditing ? (
                      <Input
                        id="nama"
                        name="nama"
                        value={formData.nama}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {formData.nama || "Tidak tersedia"}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {formData.email || "Tidak tersedia"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="noTelepon">Nomor Telepon</Label>
                    {isEditing ? (
                      <Input
                        id="noTelepon"
                        name="noTelepon"
                        value={formData.noTelepon}
                        onChange={handleInputChange}
                        placeholder="Masukkan nomor telepon"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {formData.noTelepon || "Tidak tersedia"}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="alamat">Alamat</Label>
                    {isEditing ? (
                      <Input
                        id="alamat"
                        name="alamat"
                        value={formData.alamat}
                        onChange={handleInputChange}
                        placeholder="Masukkan alamat"
                        className="mt-1"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {formData.alamat || "Tidak tersedia"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Info Sidebar */}
          <div className="space-y-6">
            {/* Account Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Status Akun
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Role</Label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getRoleColor(session.user.role || "")
                      }`}>
                        {getRoleDisplay(session.user.role || "")}
                      </span>
                    </div>
                  </div>
                  
                  {session.user.tipePengguna && (
                    <div>
                      <Label>Tipe Pengguna</Label>
                      <p className="mt-1 text-sm text-gray-900">
                        {session.user.tipePengguna}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <Label>Status</Label>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Aktif
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Aksi Akun</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Ubah Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Riwayat Aktivitas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}