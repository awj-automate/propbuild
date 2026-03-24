import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/auth/signin",
  },
})

export const config = {
  matcher: ["/dashboard/:path*", "/api/templates/:path*", "/api/proposals/:path*", "/api/upload/:path*", "/api/generate/:path*", "/api/settings/:path*"],
}
