'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Calendar, Edit, Trash2, UserPlus, Search } from 'lucide-react';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'MAHASISWA' | 'PETUGAS';
  nim?: string;
  nip?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'MAHASISWA' | 'PETUGAS'>('ALL');

  // Load users from API
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users?limit=100');
      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform API data to match component interface
        interface UserData {
          id: string
          nama: string
          email: string
          role: string
          googleId?: string
          phone?: string
          createdAt: string
          updatedAt: string
        }
        const transformedUsers = result.data.map((user: UserData) => ({
          id: user.id,
          name: user.nama,
          email: user.email,
          role: user.role,
          nim: user.role === 'MAHASISWA' ? user.googleId : undefined,
          nip: user.role === 'PETUGAS' ? user.googleId : undefined,
          phone: user.phone || 'Tidak tersedia',
          createdAt: user.createdAt,
          lastLogin: user.updatedAt
        }));
        setUsers(transformedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Check authentication and authorization
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
      return;
    }

    if (session.user?.role !== 'PETUGAS') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert('Pengguna berhasil dihapus!');
          loadUsers(); // Reload data from server
        } else {
          alert('Gagal menghapus pengguna: ' + result.error);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Gagal menghapus pengguna');
      }
    }
  };

  const handleEditUser = (userId: string) => {
    alert(`Edit pengguna dengan ID: ${userId}`);
    // TODO: Implement edit functionality with modal
  };

  const handleAddUser = () => {
    alert('Fitur tambah pengguna akan segera tersedia!');
    // TODO: Implement add user functionality with modal
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MAHASISWA': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PETUGAS': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.nim && user.nim.includes(searchTerm)) ||
                         (user.nip && user.nip.includes(searchTerm));
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Memuat data pengguna...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-2 border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Kelola Pengguna</h1>
              <p className="text-lg text-gray-700 font-medium">Kelola data pengguna sistem booking fasilitas</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleAddUser}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 transition-colors duration-200"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Tambah Pengguna
              </Button>
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 transition-colors duration-200"
              >
                Kembali ke Dashboard
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, email, NIM, atau NIP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none font-medium"
              />
            </div>
            
            {/* Role Filter */}
            <div className="flex gap-2">
              {['ALL', 'MAHASISWA', 'PETUGAS'].map((role) => (
                <Button
                  key={role}
                  onClick={() => setRoleFilter(role as 'ALL' | 'MAHASISWA' | 'PETUGAS')}
                  className={`px-4 py-3 font-semibold transition-colors duration-200 ${
                    roleFilter === role
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {role === 'ALL' ? 'Semua' : role}
                  <span className="ml-2 bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs">
                    {role === 'ALL' ? users.length : users.filter(u => u.role === role).length}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="grid gap-6">
          {filteredUsers.length === 0 ? (
            <Card className="bg-white shadow-lg border-2 border-gray-200">
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada pengguna</h3>
                <p className="text-gray-600">Tidak ada pengguna yang sesuai dengan kriteria pencarian.</p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} className="bg-white shadow-lg border-2 border-gray-200 hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="bg-gray-50 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-100 p-3 rounded-full">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                          {user.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700 font-medium">{user.email}</span>
                        </div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-lg border-2 font-semibold text-sm ${getRoleColor(user.role)}`}>
                          {user.role}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditUser(user.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-600 hover:bg-red-700 text-white p-2 transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 mb-2">Informasi Identitas</h4>
                      <div className="space-y-2 text-sm">
                        {user.nim && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-600 w-16">NIM:</span>
                            <span className="text-gray-800 font-medium">{user.nim}</span>
                          </div>
                        )}
                        {user.nip && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-600 w-16">NIP:</span>
                            <span className="text-gray-800 font-medium">{user.nip}</span>
                          </div>
                        )}
                        {user.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900 mb-2">Informasi Akun</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">
                            <span className="font-medium">Terdaftar:</span> {new Date(user.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        {user.lastLogin && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">
                              <span className="font-medium">Login terakhir:</span> {new Date(user.lastLogin).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}