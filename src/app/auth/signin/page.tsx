"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Mail, Lock } from "lucide-react"

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [credentials, setCredentials] = useState({ email: "", password: "" })
  const router = useRouter()

  // Handle Google SSO for UGM students
  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const result = await signIn("google", {
        callbackUrl: "/dashboard",
        redirect: false
      })
      
      if (result?.error) {
        setError("Login gagal. Pastikan Anda menggunakan email UGM.")
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch {
      setError("Terjadi kesalahan saat login dengan Google")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle credentials login for admin/petugas
  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const result = await signIn("credentials", {
        email: credentials.email,
        password: credentials.password,
        redirect: false
      })
      
      if (result?.error) {
        setError("Email atau password salah")
      } else {
        router.push("/dashboard")
      }
    } catch {
      setError("Terjadi kesalahan saat login")
    } finally {
      setIsLoading(false)
    }
  }

  // Send OTP to external user
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setOtpSent(true)
      } else {
        setError(data.error || "Gagal mengirim kode OTP")
      }
    } catch {
      setError("Terjadi kesalahan saat mengirim kode OTP")
    } finally {
      setIsLoading(false)
    }
  }

  // Verify OTP for external user
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        // Store token in localStorage for client-side access
        localStorage.setItem("external_token", data.token)
        
        // Cookie is already set by the backend with httpOnly flag
        // Force page reload to ensure middleware picks up the new cookie
        window.location.href = "/dashboard"
      } else {
        setError(data.error || "Kode OTP tidak valid")
      }
    } catch {
      setError("Terjadi kesalahan saat verifikasi OTP")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Sistem Peminjaman Fasilitas</h1>
          <p className="mt-2 text-gray-800">Masuk ke akun Anda</p>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-gray-200 shadow-sm">
            <TabsTrigger value="student" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50 font-medium">Mahasiswa</TabsTrigger>
            <TabsTrigger value="admin" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50 font-medium">Admin/Petugas</TabsTrigger>
            <TabsTrigger value="external" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-700 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50 font-medium">Eksternal</TabsTrigger>
          </TabsList>

          {/* Mahasiswa - Google SSO */}
          <TabsContent value="student">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold mb-2 text-gray-900">
                  <Mail className="h-5 w-5" />
                  Login Mahasiswa
                </CardTitle>
                <CardDescription className="text-gray-800">
                  Gunakan akun Google UGM Anda untuk masuk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 hover:text-white font-medium text-lg px-8 py-3"
                  variant="outline"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Masuk dengan Google UGM
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin/Petugas - Credentials */}
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold mb-2 text-gray-900">
                  <Lock className="h-5 w-5" />
                  Login Admin/Petugas
                </CardTitle>
                <CardDescription className="text-gray-800">
                  Masuk dengan email dan password. Akun petugas/admin harus dibuat terlebih dahulu oleh administrator sistem.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="admin-email" className="text-gray-800 font-medium">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={credentials.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCredentials({ ...credentials, email: e.target.value })}
                      required
                      disabled={isLoading}
                      className="border-2 border-gray-300 focus:border-blue-500 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-password" className="text-gray-800 font-medium">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={credentials.password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCredentials({ ...credentials, password: e.target.value })}
                      required
                      disabled={isLoading}
                      className="border-2 border-gray-300 focus:border-blue-500 bg-white text-gray-900"
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Masuk
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* External - OTP */}
          <TabsContent value="external">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold mb-2 text-gray-900">
                  <Mail className="h-5 w-5" />
                  Login Pengguna Eksternal
                </CardTitle>
                <CardDescription className="text-gray-800">
                  {otpSent ? "Masukkan kode OTP yang dikirim ke email Anda" : "Masukkan email untuk menerima kode OTP"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!otpSent ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div>
                      <Label htmlFor="external-email" className="text-gray-800 font-medium">Email</Label>
                      <Input
                        id="external-email"
                        type="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="contoh@email.com"
                        className="border-2 border-gray-300 focus:border-blue-500 bg-white text-gray-900"
                      />
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Kirim Kode OTP
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div>
                      <Label htmlFor="otp" className="text-gray-800 font-medium">Kode OTP</Label>
                      <Input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="123456"
                        maxLength={6}
                        className="border-2 border-gray-300 focus:border-blue-500 bg-white text-gray-900"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setOtpSent(false)
                          setOtp("")
                          setError("")
                        }}
                        disabled={isLoading}
                        className="flex-1 border-2 border-gray-400 text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-medium"
                      >
                        Kembali
                      </Button>
                      <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Verifikasi
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}