import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role, TipePengguna } from '@prisma/client'
import jwt from 'jsonwebtoken'

export interface AuthenticatedUser {
  id: string
  email: string
  nama: string
  role: Role
  tipePengguna?: TipePengguna
  googleId?: string
}

export interface AuthContext {
  user: AuthenticatedUser
  isAuthenticated: boolean
}

/**
 * Get authenticated user from session or JWT token
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthContext | null> {
  try {
    // Try JWT token for authentication
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string }
        
        // Get user data from database
        const user = await prisma.pengguna.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            nama: true,
            role: true,
            tipePengguna: true,
            googleId: true
          }
        })

        if (user) {
          return {
            user: {
              id: user.id,
              email: user.email,
              nama: user.nama,
              role: user.role,
              tipePengguna: user.tipePengguna || undefined,
              googleId: user.googleId || undefined
            },
            isAuthenticated: true
          }
        }
      } catch (jwtError) {
        console.error('JWT verification failed:', jwtError)
      }
    }

    return null
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth() {
  return async (request: NextRequest) => {
    const authContext = await getAuthenticatedUser(request)
    
    if (!authContext?.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return authContext
  }
}

/**
 * Middleware to require specific roles
 */
export function requireRoles(allowedRoles: Role[]) {
  return async (request: NextRequest) => {
    const authContext = await getAuthenticatedUser(request)
    
    if (!authContext?.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!allowedRoles.includes(authContext.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return authContext
  }
}

/**
 * Middleware to require admin role
 */
export function requireAdmin() {
  return requireRoles([Role.PETUGAS])
}

/**
 * Middleware to require user to be owner of resource or admin
 */
export function requireOwnerOrAdmin(getUserId: (request: NextRequest) => string) {
  return async (request: NextRequest) => {
    const authContext = await getAuthenticatedUser(request)
    
    if (!authContext?.isAuthenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const resourceUserId = getUserId(request)
    const isOwner = authContext.user.id === resourceUserId
    const isAdmin = authContext.user.role === Role.PETUGAS

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    return authContext
  }
}

/**
 * Check if user has permission to access resource
 */
export function hasPermission(
  user: AuthenticatedUser,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  // Admin has all permissions
  if (user.role === Role.PETUGAS) {
    return true
  }

  // Define permissions for different resources
  const permissions: Record<string, Record<Role, string[]>> = {
    peminjaman: {
      [Role.MAHASISWA]: ['create', 'read', 'update'],
      [Role.EKSTERNAL]: ['create', 'read', 'update'],
      [Role.PETUGAS]: ['create', 'read', 'update', 'delete']
    },
    fasilitas: {
      [Role.MAHASISWA]: ['read'],
      [Role.EKSTERNAL]: ['read'],
      [Role.PETUGAS]: ['create', 'read', 'update', 'delete']
    },
    users: {
      [Role.MAHASISWA]: ['read'],
      [Role.EKSTERNAL]: ['read'],
      [Role.PETUGAS]: ['create', 'read', 'update', 'delete']
    },
    notifications: {
      [Role.MAHASISWA]: ['read', 'update'],
      [Role.EKSTERNAL]: ['read', 'update'],
      [Role.PETUGAS]: ['create', 'read', 'update', 'delete']
    },
    reports: {
      [Role.MAHASISWA]: [],
      [Role.EKSTERNAL]: [],
      [Role.PETUGAS]: ['read']
    }
  }

  const resourcePermissions = permissions[resource]
  if (!resourcePermissions) {
    return false
  }

  const userPermissions = resourcePermissions[user.role]
  return userPermissions?.includes(action) || false
}

/**
 * Validate API key for external integrations
 */
export function validateApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key')
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || []
  
  return apiKey ? validApiKeys.includes(apiKey) : false
}

/**
 * Rate limiting middleware
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return async (request: NextRequest) => {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const now = Date.now()

    // Clean up old entries
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.resetTime < now) {
        rateLimitMap.delete(key)
      }
    }

    const current = rateLimitMap.get(ip)
    
    if (!current) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
      return null
    }

    if (current.resetTime < now) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
      return null
    }

    if (current.count >= maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    current.count++
    return null
  }
}

/**
 * CORS middleware
 */
export function corsMiddleware() {
  return () => {
    const response = NextResponse.next()
    
    // Set CORS headers
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key')
    response.headers.set('Access-Control-Max-Age', '86400')

    return response
  }
}

/**
 * Combine multiple middlewares
 */
export function combineMiddlewares(...middlewares: Array<(request: NextRequest) => Promise<NextResponse | null> | NextResponse | null>) {
  return async (request: NextRequest) => {
    for (const middleware of middlewares) {
      const result = await middleware(request)
      if (result instanceof NextResponse) {
        return result
      }
    }
    return null
  }
}

/**
 * Utility to extract user ID from request params
 */
export function extractUserIdFromParams(request: NextRequest): string {
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  return pathSegments[pathSegments.length - 1]
}

/**
 * Utility to extract peminjaman ID from request params
 */
export function extractPeminjamanIdFromParams(request: NextRequest): string {
  const url = new URL(request.url)
  const pathSegments = url.pathname.split('/')
  return pathSegments[pathSegments.length - 1]
}