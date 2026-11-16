import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

/**
 * Edge gate for the staff area and legacy WordPress endpoints.
 * Every admin page/action ALSO re-verifies the session server-side (requireAdmin).
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Legacy WordPress endpoints are gone for good.
  if (pathname.startsWith("/wp-") || pathname === "/xmlrpc.php") {
    return new NextResponse("Gone", { status: 410 });
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  const res = NextResponse.next();
  if (pathname.startsWith("/admin") || pathname.startsWith("/booking")) {
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/booking/:path*", "/(wp-.*)", "/xmlrpc.php"],
};
