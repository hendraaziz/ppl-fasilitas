import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { authenticateUser, isUGMEmail, createOrUpdateGoogleUser } from "@/lib/auth"
import type { Account, User, Session } from "next-auth"
import type { JWT } from "next-auth/jwt"

const { handlers } = NextAuth({
  providers: [
    // Google Provider for UGM SSO
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
      // Remove hd restriction to allow both @mail.ugm.ac.id and @ugm.ac.id
      // Domain validation will be handled in signIn callback
    }),
     
     // Credentials Provider for Admin/Petugas
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await authenticateUser(credentials.email as string, credentials.password as string)
        
        if (!user) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.nama,
          role: user.role,
          tipePengguna: user.tipePengguna
        }
      }
    })
  ],
  
  session: {
    strategy: "jwt" as const
  },
  
  callbacks: {
    async signIn({ user, account }) {
      // const { user, account } = params
      if (account?.provider === "google") {
        // Handle Google SSO for UGM students
        if (!isUGMEmail(user.email!)) {
          // Redirect to error page with AccessDenied error
          return '/auth/error?error=AccessDenied'
        }

        try {
          // Create or update user in database
          await createOrUpdateGoogleUser(user.email!, user.name!, account.providerAccountId)
        } catch (error) {
          console.error('Error creating/updating Google user:', error)
          return '/auth/error?error=Configuration'
        }
      }
      
      return true
    },
    
    async jwt({ token, user }) {
      // const { token, user } = params
      if (user) {
        // Get user data from database
        const dbUser = await prisma.pengguna.findUnique({
          where: { email: user.email! }
        })
        
        if (dbUser) {
          token.role = dbUser.role
          token.tipePengguna = dbUser.tipePengguna
          token.userId = dbUser.id
        }
      }
      
      return token
    },
    
    async session({ session, token }) {
      // const { session, token } = params
      if (token && session.user) {
        session.user.id = token.userId
        session.user.role = token.role
        session.user.tipePengguna = token.tipePengguna
      }
      
      return session
    }
  },
  
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  
  secret: process.env.NEXTAUTH_SECRET
})

export const { GET, POST } = handlers