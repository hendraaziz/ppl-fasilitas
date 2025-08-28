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
  User,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  UserX,
  Edit,
  Trash2,
  Plus,
  Filter,
  Save,
  X
} from "lucide-react"

// Mock data for users
const mockUsers = [
  {
    id: 1,
    nama: "John Doe",
    email: "john@ugm.ac.id",
    nomorTelepon: "081234567890",
    alamat: "Jl. Malioboro No. 1, Yogyakarta",
    role: "MAHASISWA",
    tipePengguna: "MAHASISWA",
    status: "AKTIF",
    tanggalDaftar: "2024-01-01",
    terakhirLogin: "2024-01-14"
  },
  {
    id: 2,
    nama: "Jane Smith",
    email: "jane.smith@gmail.com",
    nomorTelepon: "081234567891",
    alamat: "Jl. Sudirman No. 10, Jakarta",
    role: "EKSTERNAL",
    tipePengguna: "EKSTERNAL",
    status: "AKTIF",
    tanggalDaftar: "2024-01-05",
    terakhirLogin: "2024-01-13"
  },
  {
    id: 3,
    nama: "Ahmad Rahman",
    email: "ahmad@staff.ugm.ac.id",
    nomorTelepon: "081234567892",
    alamat: "Jl. Kaliurang KM 5, Yogyakarta",
    role: "PETUGAS",
    tipePengguna: "PETUGAS",
    status: "AKTIF",
    tanggalDaftar: "2023-12-01",
    terakhirLogin: "2024-01-14"
  },
  {
    id: 4,
    nama: "Sarah Wilson",
    email: "sarah@ugm.ac.id",
    nomorTelepon: "081234567893",
    alamat: "Jl. Gejayan No. 25, Yogyakarta",
    role: "MAHASISWA",
    tipePengguna: "MAHASISWA",
    status: "NONAKTIF",
    tanggalDaftar: "2023-11-15",
    terakhirLogin: "2023-12-20"
  },
  {
    id: 5,
    nama: "Michael Johnson",
    email: "michael@company.com",
    nomorTelepon: "081234567894",
    alamat: "Jl. Thamrin No. 15, Jakarta",
    role: "EKSTERNAL",
    tipePengguna: "EKSTERNAL",
    status: "PENDING",
    tanggalDaftar: "2024-01-12",
    terakhirLogin: "-"
  }
]

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState(mockUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [selectedUser, setSelectedUser] = useState<typeof mockUsers[0] | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    nomorTelepon: "",
    alamat: "",
    role: "MAHASISWA",
    status: "AKTIF"
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter
    const matchesStatus = statusFilter === "ALL" || user.status === statusFilter
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const openModal = (user?: typeof mockUsers[0] | null, editMode = false) => {
    setIsEditMode(editMode)
    if (user) {
      setSelectedUser(user)
      if (editMode) {
        setFormData({
          nama: user.nama,
          email: user.email,
          nomorTelepon: user.nomorTelepon,
          alamat: user.alamat,
          role: user.role,
          status: user.status
        })
      }
    } else {
      setSelectedUser(null)
      setFormData({
        nama: "",
        email: "",
        nomorTelepon: "",
        alamat: "",
        role: "MAHASISWA",
        status: "AKTIF"
      })
    }
    setIsModalOpen(true)
    setMessage(null)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
    setIsEditMode(false)
    setMessage(null)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      // TODO: Implement API call
      // const response = await fetch('/api/admin/users', {
      //   method: selectedUser ? 'PUT' : 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     ...formData,
      //     id: selectedUser?.id
      //   })
      // })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const userData = {
        ...formData,
        id: selectedUser?.id || Date.now(),
        tipePengguna: formData.role,
        tanggalDaftar: selectedUser?.tanggalDaftar || new Date().toISOString().split('T')[0],
        terakhirLogin: selectedUser?.terakhirLogin || "-"
      }
      
      if (selectedUser) {
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? userData : u))
        setMessage({ type: "success", text: "Pengguna berhasil diperbarui" })
      } else {
        setUsers(prev => [...prev, userData])
        setMessage({ type: "success", text: "Pengguna berhasil ditambahkan" })
      }
      
      closeModal()
    } catch {
      setMessage({ type: "error", text: "Gagal menyimpan pengguna" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async (userId: number, newStatus: string) => {
    try {
      // TODO: Implement API call
      // await fetch(`/api/admin/users/${userId}/status`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: newStatus })
      // })
      
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ))
      
      const statusText = {
        'AKTIF': 'diaktifkan',
        'NONAKTIF': 'dinonaktifkan',
        'PENDING': 'diubah ke pending'
      }[newStatus] || 'diperbarui'
      
      setMessage({ type: "success", text: `Pengguna berhasil ${statusText}` })
    } catch {
      setMessage({ type: "error", text: "Gagal memperbarui status pengguna" })
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pengguna ini?")) {
      return
    }

    try {
      // TODO: Implement API call
      // await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      
      setUsers(prev => prev.filter(u => u.id !== userId))
      setMessage({ type: "success", text: "Pengguna berhasil dihapus" })
    } catch {
      setMessage({ type: "error", text: "Gagal menghapus pengguna" })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AKTIF":
        return "bg-green-100 text-green-800"
      case "NONAKTIF":
        return "bg-red-100 text-red-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
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

  const isFormValid = () => {
    return formData.nama && formData.email && formData.nomorTelepon
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
              <h1 className="text-3xl font-bold text-gray-900">Kelola Pengguna</h1>
              <p className="text-gray-600 mt-2">Kelola semua pengguna sistem</p>
            </div>
            <Button onClick={() => openModal(null, true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Pengguna
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
              placeholder="Cari pengguna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Semua Role</option>
              <option value="MAHASISWA">Mahasiswa</option>
              <option value="PETUGAS">Petugas</option>
              <option value="EKSTERNAL">Eksternal</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">Semua Status</option>
              <option value="AKTIF">Aktif</option>
              <option value="NONAKTIF">Non-aktif</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.nama}
                      </h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getRoleColor(user.role)
                      }`}>
                        {user.role}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(user.status)
                      }`}>
                        {user.status}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2" />
                        {user.email}
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2" />
                        {user.nomorTelepon}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        {user.alamat}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Terdaftar: {user.tanggalDaftar} | Terakhir login: {user.terakhirLogin}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModal(user, false)}
                    >
                      <User className="h-4 w-4 mr-1" />
                      Detail
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModal(user, true)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {user.status === "AKTIF" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(user.id, "NONAKTIF")}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(user.id, "AKTIF")}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
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

        {/* Detail/Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {isEditMode ? (selectedUser ? "Edit Pengguna" : "Tambah Pengguna") : "Detail Pengguna"}
                    </CardTitle>
                    <CardDescription>
                      {isEditMode ? "Perbarui informasi pengguna" : "Informasi lengkap pengguna"}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" onClick={closeModal}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditMode ? (
                  // Edit Form
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nama">Nama Lengkap</Label>
                        <Input
                          id="nama"
                          name="nama"
                          value={formData.nama}
                          onChange={handleInputChange}
                          placeholder="Masukkan nama lengkap"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Masukkan email"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="nomorTelepon">Nomor Telepon</Label>
                        <Input
                          id="nomorTelepon"
                          name="nomorTelepon"
                          value={formData.nomorTelepon}
                          onChange={handleInputChange}
                          placeholder="Masukkan nomor telepon"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="role">Role</Label>
                        <select
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleInputChange}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="MAHASISWA">Mahasiswa</option>
                          <option value="PETUGAS">Petugas</option>
                          <option value="EKSTERNAL">Eksternal</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="alamat">Alamat</Label>
                        <textarea
                          id="alamat"
                          name="alamat"
                          value={formData.alamat}
                          onChange={handleInputChange}
                          placeholder="Masukkan alamat lengkap"
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
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
                          <option value="NONAKTIF">Non-aktif</option>
                          <option value="PENDING">Pending</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={handleSubmit}
                        disabled={!isFormValid() || isLoading}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? "Menyimpan..." : (selectedUser ? "Perbarui" : "Simpan")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={closeModal}
                        disabled={isLoading}
                      >
                        Batal
                      </Button>
                    </div>
                  </>
                ) : (
                  // Detail View
                  selectedUser && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Nama Lengkap</Label>
                          <p className="text-sm text-gray-900">{selectedUser.nama}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Email</Label>
                          <p className="text-sm text-gray-900">{selectedUser.email}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Nomor Telepon</Label>
                          <p className="text-sm text-gray-900">{selectedUser.nomorTelepon}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Role</Label>
                          <p className="text-sm text-gray-900">{selectedUser.role}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Status</Label>
                          <p className="text-sm text-gray-900">{selectedUser.status}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Tipe Pengguna</Label>
                          <p className="text-sm text-gray-900">{selectedUser.tipePengguna}</p>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Alamat</Label>
                        <p className="text-sm text-gray-900">{selectedUser.alamat}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Tanggal Daftar</Label>
                          <p className="text-sm text-gray-900">{selectedUser.tanggalDaftar}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Terakhir Login</Label>
                          <p className="text-sm text-gray-900">{selectedUser.terakhirLogin}</p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}