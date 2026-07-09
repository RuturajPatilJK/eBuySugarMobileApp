import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL || 'https://trading-api.ebuysugar.com';

// Headers that must not be forwarded to the upstream server
const HOP_BY_HOP = new Set([
    'connection', 'keep-alive', 'transfer-encoding', 'te',
    'trailer', 'upgrade', 'proxy-authorization', 'proxy-authenticate',
    'host',
]);

async function proxy(request, context) {
    const { path } = await context.params;
    const { search } = new URL(request.url);
    const upstream = `${BACKEND}/${path.join('/')}${search}`;

    // Forward browser headers, skipping hop-by-hop
    const forwardHeaders = {};
    request.headers.forEach((v, k) => {
        if (!HOP_BY_HOP.has(k.toLowerCase())) {
            forwardHeaders[k] = v;
        }
    });

    // Read body for mutation methods
    let body = undefined;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        const buf = await request.arrayBuffer();
        if (buf.byteLength > 0) body = buf;
    }

    // Fetch upstream — redirect: 'follow' prevents CORS from browser-followed redirects
    const res = await fetch(upstream, {
        method: request.method,
        headers: forwardHeaders,
        body,
        redirect: 'follow',
    });

    // Rewrite Set-Cookie: strip Domain + Secure so cookies work on localhost
    const resHeaders = new Headers();
    const isDev = process.env.NODE_ENV === 'development';

    const setCookies = typeof res.headers.getSetCookie === 'function'
        ? res.headers.getSetCookie()
        : [];

    res.headers.forEach((v, k) => {
        const lower = k.toLowerCase();
        if (HOP_BY_HOP.has(lower)) return;
        if (lower === 'set-cookie') {
            // handled separately below via getSetCookie()
            return;
        }
        resHeaders.set(k, v);
    });

    for (const cookie of setCookies) {
        const cleaned = isDev
            ? cookie.replace(/;\s*domain=[^;]*/gi, '').replace(/;\s*secure\b/gi, '')
            : cookie;
        resHeaders.append('set-cookie', cleaned);
    }

    return new NextResponse(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: resHeaders,
    });
}

export const GET     = proxy;
export const POST    = proxy;
export const PUT     = proxy;
export const PATCH   = proxy;
export const DELETE  = proxy;
export const OPTIONS = proxy;
export const HEAD    = proxy;
