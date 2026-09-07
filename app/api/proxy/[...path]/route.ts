import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.RENTOS_API_URL ?? "http://localhost:8080";

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(
  req: NextRequest,
  ctx: RouteContext,
): Promise<NextResponse> {
  const { path } = await ctx.params;
  const pathname = path.join("/");
  const search = req.nextUrl.search;

  const targetUrl = `${BACKEND_URL}/api/v1/${pathname}${search}`;

  // Forward all headers except host (which would confuse the backend)
  const headers = new Headers(req.headers);
  headers.delete("host");

  // Ensure Content-Type is preserved for POST/PUT/PATCH
  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      // Don't follow redirects — pass them back to the browser
      redirect: "manual",
    });

    const responseHeaders = new Headers(upstream.headers);
    // Strip hop-by-hop headers
    responseHeaders.delete("transfer-encoding");
    responseHeaders.delete("connection");

    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error("[BFF proxy] upstream error:", err);
    return NextResponse.json(
      { success: false, code: "GATEWAY_ERROR", message: "Failed to reach API" },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
