"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  name: string
  role: string
  tipePengguna: string
}

interface SessionUser extends User {
  [key: string]: unknown
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  authType: 'nextauth' | 'external' | null
}

export function useAuth(): AuthState {
  const { data: session, status } = useSession()
  const [externalUser, setExternalUser] = useState<User | null>(null)
  const [isLoadingExternal, setIsLoadingExternal] = useState(true)

  // Check for external token on mount
  useEffect(() => {
    const checkExternalAuth = () => {
      try {
        const token = localStorage.getItem('external_token')
        if (token) {
          // Decode JWT token to get user info
          const payload = JSON.parse(atob(token.split('.')[1]))
          setExternalUser({
            id: payload.userId,
            email: payload.email,
            name: payload.email.split('@')[0], // Use email prefix as name
            role: payload.role,
            tipePengguna: payload.tipePengguna
          })
        }
      } catch (error) {
        console.error('Error parsing external token:', error)
        // Clear invalid token
        localStorage.removeItem('external_token')
        document.cookie = 'external_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      } finally {
        setIsLoadingExternal(false)
      }
    }

    checkExternalAuth()
  }, [])

  // Determine auth state
  const isLoading = status === 'loading' || isLoadingExternal
  const nextAuthUser = session?.user
  const user = nextAuthUser || externalUser
  const isAuthenticated = !!user
  const authType = nextAuthUser ? 'nextauth' : externalUser ? 'external' : null

  return {
    user: user ? {
      id: user.id,
      email: user.email,
      name: user.name || user.email,
      role: (user as SessionUser).role,
      tipePengguna: (user as SessionUser).tipePengguna
    } : null,
    isLoading,
    isAuthenticated,
    authType
  }
}

// Custom hook for protected routes
export function useAuthGuard(requiredRole?: string) {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (auth.isLoading) return

    if (!auth.isAuthenticated) {
      router.push('/auth/signin')
      return
    }

    if (requiredRole && auth.user?.role !== requiredRole) {
      router.push('/dashboard')
      return
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.user?.role, requiredRole, router])

  return auth
}

// Logout function that handles both auth types
export async function logout() {
  try {
    // Clear external token
    localStorage.removeItem('external_token')
    document.cookie = 'external_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    
    // Sign out from NextAuth if session exists
    await signOut({ 
      redirect: true,
      callbackUrl: '/auth/signin'
    })
  } catch (error) {
    console.error('Error during logout:', error)
    // Fallback: force redirect to signin
    window.location.href = '/auth/signin'
  }
}