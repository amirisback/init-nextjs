import { NextResponse } from "next/server";

export function proxy() {
  // Pass-through middleware since language is handled via cookie/localization state
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip internal paths (_next), API routes, and static files
    "/((?!_next|api|.*\\..*).*)",
  ],
};
