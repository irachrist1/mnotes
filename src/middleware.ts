import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";

const isSignInPage = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const hasConvexUrl = Boolean(convexUrl && !convexUrl.includes("placeholder"));

export default hasConvexUrl
  ? convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
      // Redirect authenticated users away from sign-in page
      if (isSignInPage(request) && (await convexAuth.isAuthenticated())) {
        return nextjsMiddlewareRedirect(request, "/dashboard");
      }
      // Redirect unauthenticated users to sign-in
      if (isProtectedRoute(request) && !(await convexAuth.isAuthenticated())) {
        return nextjsMiddlewareRedirect(request, "/sign-in");
      }
    })
  : async () => {
      // Convex not configured: don't block navigation with auth middleware.
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/sign-in/:path*",
    "/sign-up/:path*",
    // Required by ConvexAuthNextjsServerProvider
    "/api/auth/:path*",
  ],
};
