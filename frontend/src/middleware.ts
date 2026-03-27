import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { routePermissions } from "@/lib/route-permissions";
import type { Permission } from "@/lib/types";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "rbac-demo-secret");

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (pathname === "/forbidden") {
    return NextResponse.next();
  }

  const requiredPermission = routePermissions[pathname];
  if (!requiredPermission) {
    return NextResponse.next();
  }

  const token = request.cookies.get("rbac_hint")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.type !== "hint") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const permissions = ((payload.permissions as string[]) ?? []) as Permission[];
    if (!permissions.includes(requiredPermission)) {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/dashboard", "/users", "/leads", "/tasks", "/reports", "/audit-log", "/customer-portal", "/settings"],
};
