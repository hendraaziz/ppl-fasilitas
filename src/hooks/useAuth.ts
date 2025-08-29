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
        // First try localStorage
        let token = localStorage.getItem('external_token')
        
        // If not in localStorage, try to get from cookie (for SSR compatibility)
        if (!token && typeof document !== 'undefined') {
          const cookieMatch = document.cookie.match(/external_token=([^;]+)/)
          if (cookieMatch) {
            token = cookieMatch[1]
            // Sync to localStorage for future use
            localStorage.setItem('external_token', token)
          }
        }
        
        if (token) {
          // Decode JWT token to get user info
          const payload = JSON.parse(atob(token.split('.')[1]))
          
          // Check if token is expired
          const currentTime = Math.floor(Date.now() / 1000)
          if (payload.exp && payload.exp < currentTime) {
            throw new Error('Token expired')
          }
          
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
        // Clear invalid token from both localStorage and cookie
        localStorage.removeItem('external_token')
        if (typeof document !== 'undefined') {
          document.cookie = 'external_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        }
        setExternalUser(null)
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
      callbackUrl: '/'
    })
  } catch (error) {
    console.error('Error during logout:', error)
    // Fallback: force redirect to home
    window.location.href = '/'
  }
}