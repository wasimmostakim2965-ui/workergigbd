const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isSecureRequest(req: { headers: Headers | Record<string, string | string[] | undefined> }) {
  let protocol: string | undefined;
  
  if (req.headers instanceof Headers) {
    protocol = req.headers.get("x-forwarded-proto") ?? undefined;
  } else {
    const forwardedProto = req.headers["x-forwarded-proto"];
    if (typeof forwardedProto === "string") {
      protocol = forwardedProto.split(",")[0].trim().toLowerCase();
    }
  }
  
  if (protocol === "https") return true;
  return false;
}

export function getSessionCookieOptions(
  req: { headers: Headers | Record<string, string | string[] | undefined> }
): { httpOnly: boolean; path: string; sameSite: "none" | "lax" | "strict"; secure: boolean; maxAge?: number } {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: isSecureRequest(req),
  };
}

// Helper to create Set-Cookie header string for Vercel
export function createSessionCookieHeader(token: string, options: ReturnType<typeof getSessionCookieOptions>, maxAgeMs?: number): string {
  const parts = [
    `session_id=${token}`,
    `HttpOnly`,
    `Path=${options.path}`,
    `SameSite=${options.sameSite}`,
    options.secure ? `Secure` : "",
    maxAgeMs ? `Max-Age=${Math.floor(maxAgeMs / 1000)}` : "",
  ].filter(Boolean);
  
  return parts.join("; ");
}
