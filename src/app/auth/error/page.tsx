'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

const errorMessages = {
  Configuration: 'Terjadi kesalahan konfigurasi server.',
  AccessDenied: 'Akses ditolak. Pastikan Anda menggunakan email UGM (@mail.ugm.ac.id atau @ugm.ac.id).',
  Verification: 'Token verifikasi tidak valid atau sudah kedaluwarsa.',
  Default: 'Terjadi kesalahan saat login. Silakan coba lagi.'
}

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  
  const errorMessage = error && error in errorMessages 
    ? errorMessages[error as keyof typeof errorMessages]
    : errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Login Gagal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {errorMessage}
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          {error === 'AccessDenied' && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Untuk mahasiswa UGM:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Gunakan email UGM Anda (@mail.ugm.ac.id)</li>
                  <li>Pastikan akun Google UGM Anda aktif</li>
                </ul>
                <p className="font-medium mt-4 mb-2">Untuk pengguna eksternal:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Gunakan fitur login dengan OTP</li>
                  <li>Masukkan email Anda dan ikuti instruksi</li>
                </ul>
              </div>
            </div>
          )}
          
          <Link
            href="/auth/signin"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  )
}