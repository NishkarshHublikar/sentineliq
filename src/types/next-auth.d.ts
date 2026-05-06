import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      mfaEnabled: boolean
      mfaVerified?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    mfaEnabled: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    mfaEnabled: boolean
    mfaVerified?: boolean
  }
}
