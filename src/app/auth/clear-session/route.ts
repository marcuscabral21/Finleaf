import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/login?message=session-expired", request.url),
  );

  for (const { name } of request.cookies.getAll()) {
    if (!/^sb-.+-auth-token(?:\.\d+)?$/.test(name)) continue;

    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }

  return response;
}
