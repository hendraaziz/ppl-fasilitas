import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      tipePengguna: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role?: string
    tipePengguna?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string
    role: string
    tipePengguna: string
  }
}