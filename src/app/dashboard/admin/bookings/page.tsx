'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Eye, Calendar, User, MapPin } from 'lucide-react';

interface Booking {
  id: string;
  facilityName: string;
  userName: string;
  userEmail: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export default function AdminBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Load bookings from API
  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings?limit=100');
      const result = await response.json();
      
      if (result.success && result.data) {
        // Transform API data to match component interface
        interface BookingData {
          id: string
          fasilitas: { nama: string }
          user: { nama: string; email: string }
          tglMulai: string
          tglSelesai: string
          tujuan: string
          status: string
          createdAt: string
        }
        const transformedBookings = result.data.map((booking: BookingData) => ({
          id: booking.id,
          facilityName: booking.fasilitas.nama,
          userName: booking.user.nama,
          userEmail: booking.user.email,
          startTime: booking.tglMulai,
          endTime: booking.tglSelesai,
          purpose: booking.tujuan,
          status: booking.status === 'DIPROSES' ? 'PENDING' : 
                  booking.status === 'DISETUJUI' ? 'APPROVED' : 
                  booking.status === 'DITOLAK' ? 'REJECTED' : 'PENDING',
          createdAt: booking.createdAt
        }));
        setBookings(transformedBookings);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      alert('Gagal memuat data peminjaman');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
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

  const handleApprove = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'DISETUJUI' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Peminjaman berhasil disetujui!');
        loadBookings(); // Reload data from server
      } else {
        alert('Gagal menyetujui peminjaman: ' + result.error);
      }
    } catch (error) {
      console.error('Error approving booking:', error);
      alert('Gagal menyetujui peminjaman');
    }
  };

  const handleReject = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'DITOLAK' })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Peminjaman berhasil ditolak!');
        loadBookings(); // Reload data from server
      } else {
        alert('Gagal menolak peminjaman: ' + result.error);
      }
    } catch (error) {
      console.error('Error rejecting booking:', error);
      alert('Gagal menolak peminjaman');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredBookings = bookings.filter(booking => 
    filter === 'ALL' || booking.status === filter
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Memuat data peminjaman...</p>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Kelola Peminjaman</h1>
              <p className="text-lg text-gray-700 font-medium">Setujui atau tolak permintaan peminjaman fasilitas</p>
            </div>
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 transition-colors duration-200"
            >
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Buttons */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
              <Button
                key={status}
                onClick={() => setFilter(status as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED')}
                className={`px-4 py-2 font-semibold transition-colors duration-200 ${
                  filter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {status === 'ALL' ? 'Semua' : 
                 status === 'PENDING' ? 'Menunggu' :
                 status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                <span className="ml-2 bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs">
                  {status === 'ALL' ? bookings.length : bookings.filter(b => b.status === status).length}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div className="grid gap-6">
          {filteredBookings.length === 0 ? (
            <Card className="bg-white shadow-lg border-2 border-gray-200">
              <CardContent className="py-12 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada peminjaman</h3>
                <p className="text-gray-600">Belum ada permintaan peminjaman untuk filter yang dipilih.</p>
              </CardContent>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card key={booking.id} className="bg-white shadow-lg border-2 border-gray-200 hover:shadow-xl transition-shadow duration-200">
                <CardHeader className="bg-gray-50 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                        {booking.facilityName}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{booking.userName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(booking.startTime).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 font-semibold text-sm ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      {booking.status === 'PENDING' ? 'Menunggu' :
                       booking.status === 'APPROVED' ? 'Disetujui' : 'Ditolak'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Detail Peminjaman</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700">
                              {new Date(booking.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - 
                              {new Date(booking.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                            <span className="text-gray-700">{booking.purpose}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Informasi Pemohon</h4>
                        <div className="space-y-1 text-sm text-gray-700">
                          <p><span className="font-medium">Email:</span> {booking.userEmail}</p>
                          <p><span className="font-medium">Tanggal Pengajuan:</span> {new Date(booking.createdAt).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {booking.status === 'PENDING' && (
                    <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                      <Button
                        onClick={() => handleApprove(booking.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 transition-colors duration-200"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Setujui
                      </Button>
                      <Button
                        onClick={() => handleReject(booking.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 transition-colors duration-200"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Tolak
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}