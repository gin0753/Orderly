import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { signedProxyHeaders } from "./lib/proxy-identity";

export function proxy(request: NextRequest) {
  return NextResponse.next({
    request: {
      headers: signedProxyHeaders(
        request.headers,
        process.env.ORDERLY_PROXY_IDENTITY_SECRET,
      ),
    },
  });
}

export const config = { matcher: "/api/:path*" };
