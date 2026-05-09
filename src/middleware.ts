import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const pathname = req.nextUrl.pathname
    
    const isLoginPage = pathname === "/login"
    const isAdminLoginPage = pathname === "/admin"
    const isMfaPage = pathname === "/mfa"

    // If user is already authenticated, don't let them go back to login pages
    if (isLoginPage || isAdminLoginPage) {
      if (isAuth) {
        // Redirect based on role
        if (token.role === 'admin') {
          return NextResponse.redirect(new URL("/admin/users", req.url))
        }
        return NextResponse.redirect(new URL("/", req.url))
      }
      return null
    }

    // Handle unauthenticated users
    if (!isAuth) {
      if (pathname.startsWith("/admin")) {
        return NextResponse.redirect(new URL("/admin", req.url))
      }
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // Redirect to MFA verification if enabled but not verified
    if (token.mfaEnabled && !token.mfaVerified && !isMfaPage) {
      return NextResponse.redirect(new URL("/mfa", req.url))
    }

    // Role-based access control for /admin routes
    if (pathname.startsWith("/admin") && token.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url))
    }

    return null
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        const publicPaths = ["/login", "/admin", "/api/auth"]
        if (publicPaths.some(path => pathname === path || pathname.startsWith("/api/auth"))) {
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
