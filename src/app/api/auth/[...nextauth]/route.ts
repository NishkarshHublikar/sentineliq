import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import clientPromise from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

const handler = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-secret',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const client = await clientPromise
        const user = await client.db().collection('users').findOne({ email: credentials.email })

        if (!user || !user.password) {
          // If user exists but has no password, they probably signed up with Google
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role || 'officer',
          mfaEnabled: user.mfaEnabled || false,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = (user as any).role
        token.mfaEnabled = (user as any).mfaEnabled
      }
      
      // Handle session updates (e.g. after enabling MFA)
      if (trigger === "update" && session) {
        return { ...token, ...session }
      }
      
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string
        session.user.role = token.role as string
        session.user.mfaEnabled = token.mfaEnabled as boolean
        session.user.mfaVerified = token.mfaVerified as boolean
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
