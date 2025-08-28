"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Mail, Shield, AlertCircle, CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

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
  }, [status, router, session])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Password berhasil direset dan dikirim ke email pengguna"
        })
        setEmail("")
      } else {
        setMessage({
          type: "error",
          text: data.error || "Gagal mereset password"
        })
      }
    } catch {
      setMessage({
        type: "error",
        text: "Terjadi kesalahan saat mereset password"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-800">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!session?.user || session.user.role !== "PETUGAS") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b-2 border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reset Password Admin</h1>
                <p className="text-lg text-gray-700">Kelola reset password untuk admin/petugas</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Reset Password Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
              <Shield className="h-6 w-6 text-blue-600" />
              Reset Password Admin/Petugas
            </CardTitle>
            <CardDescription className="text-base text-gray-700">
              Masukkan email admin/petugas untuk mereset password. Password baru akan digenerate otomatis dan dikirim via email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Message Alert */}
            {message && (
              <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-gray-800 font-medium text-base">
                  Email Admin/Petugas
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  disabled={isLoading}
                  className="mt-2 border-2 border-gray-300 focus:border-blue-500 bg-white text-gray-900 text-base py-3"
                />
              </div>

              <Button 
                type="submit" 
                disabled={isLoading || !email}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-base"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mereset Password...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Reset Password & Kirim Email
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg font-bold text-gray-900">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Informasi Penting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Password baru akan digenerate secara otomatis dengan kombinasi huruf, angka, dan simbol</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Password akan dikirim ke email yang terdaftar dalam sistem</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Pengguna disarankan untuk segera mengganti password setelah menerima email</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-amber-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-amber-700 font-medium">Fitur ini hanya dapat digunakan untuk akun admin/petugas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}