import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.API_SERVER_URL ?? process.env.NEXT_PUBLIC_API_URL;

function getBackendUrl(path: string[], request: NextRequest) {
  if (!BACKEND_URL) {
    throw new Error("API_SERVER_URL is not configured");
  }

  const baseUrl = BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  const target = new URL(`${baseUrl}/${path.join("/")}`);
  target.search = request.nextUrl.search;
  return target;
}

async function proxyRequest(request: NextRequest, path: string[]) {
  try {
    const target = getBackendUrl(path, request);
    const headers = new Headers();
    const authorization = request.headers.get("authorization");
    const contentType = request.headers.get("content-type");
    const cookie = request.headers.get("cookie");

    if (authorization) {
      headers.set("authorization", authorization);
    }

    if (contentType) {
      headers.set("content-type", contentType);
    }

    if (cookie) {
      headers.set("cookie", cookie);
    }

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" || request.method === "HEAD" ? undefined : await request.text(),
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers();
    const responseContentType = upstream.headers.get("content-type");
    const responseLocation = upstream.headers.get("location");
    const setCookies = (upstream.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.();

    if (responseContentType) {
      responseHeaders.set("content-type", responseContentType);
    }

    if (responseLocation) {
      responseHeaders.set("location", responseLocation);
    }

    if (setCookies?.length) {
      for (const cookieValue of setCookies) {
        responseHeaders.append("set-cookie", cookieValue);
      }
    } else {
      const setCookie = upstream.headers.get("set-cookie");
      if (setCookie) {
        responseHeaders.append("set-cookie", setCookie);
      }
    }

    const body = request.method === "HEAD" || upstream.status === 204 ? null : await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Proxy request failed" },
      { status: 502 },
    );
  }
}

type RouteContext = {
  params: { path: string[] };
};

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params.path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params.path);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params.path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params.path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context.params.path);
}
