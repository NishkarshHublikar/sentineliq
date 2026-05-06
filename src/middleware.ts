import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isLoginPage = req.nextUrl.pathname.startsWith("/login")
    const isMfaPage = req.nextUrl.pathname.startsWith("/mfa")

    if (isLoginPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL("/", req.url))
      }
      return null
    }

    if (!isAuth) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Redirect to MFA verification if enabled but not verified
    if (token.mfaEnabled && !token.mfaVerified && !isMfaPage) {
      return NextResponse.redirect(new URL("/mfa", req.url))
    }

    // Protect admin routes
    if (req.nextUrl.pathname.startsWith("/admin") && token.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return null
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Paths that don't require authentication
        const publicPaths = ["/login", "/api/auth"]
        if (publicPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
          return true
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public assets)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
}
