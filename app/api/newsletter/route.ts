import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export const maxDuration = 60;
export const runtime = "nodejs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    // Next.js can normalize request.url to localhost behind its internal server.
    // The Host header retains the address the browser actually requested.
    const requestUrl = new URL(request.url);
    const expectedHost = request.headers.get("host") || requestUrl.host;
    let matches = false;
    try {
      const originUrl = new URL(origin);
      matches = originUrl.host === expectedHost && originUrl.protocol === requestUrl.protocol;
    } catch {
      // Malformed and opaque origins are not same-origin browser submissions.
    }
    if (!matches) {
      return NextResponse.json({ message: "Please submit the form from this website." }, { status: 403 });
    }
  }

  const contentLength = Number(request.headers.get("content-length") || 0);

  if (contentLength > 10_000) {
    return NextResponse.json(
      { message: "The submitted form is too large." },
      { status: 413 },
    );
  }

  let body: unknown;

  try {
    // Count actual bytes too: Content-Length can be missing or untrusted.
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    if (!reader) throw new Error("Missing body");
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 10_000) {
        await reader.cancel();
        return NextResponse.json({ message: "The submitted form is too large." }, { status: 413 });
      }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return NextResponse.json(
      { message: "The submitted form is invalid." },
      { status: 400 },
    );
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { message: "The submitted form is invalid." },
      { status: 400 },
    );
  }

  const data = body as Record<string, unknown>;
  const website = readString(data.website);

  // Silently accept bot submissions so the honeypot does not reveal itself.
  if (website) {
    return NextResponse.json({
      message: "Thank you. You have joined the mailing list.",
    });
  }

  const email = readString(data.email).toLowerCase();
  const firstName = readString(data.firstName);
  const lastName = readString(data.lastName);
  const organization = readString(data.organization);

  if (
    !firstName ||
    firstName.length > 80 ||
    !lastName ||
    lastName.length > 80 ||
    !emailPattern.test(email) ||
    email.length > 254 ||
    organization.length > 160 ||
    [firstName, lastName, organization, email].some((value) =>
      Array.from(value).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127),
    )
  ) {
    return NextResponse.json(
      { message: "Please check the information you entered and try again." },
      { status: 400 },
    );
  }

  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const secret = process.env.NEWSLETTER_FORM_SECRET;

  if (!scriptUrl || !secret) {
    console.error("Newsletter form environment variables are not configured.");
    return NextResponse.json(
      { message: "The mailing list is temporarily unavailable." },
      { status: 503 },
    );
  }

  let failureCode = "UPSTREAM_REQUEST_FAILED";
  try {
    // Only trust Vercel's overwritten IP header on Vercel, not a client-supplied X-Forwarded-For.
    const forwardedIp = request.headers.get("x-vercel-forwarded-for")?.trim() || "";
    const clientIp = process.env.VERCEL === "1" && isIP(forwardedIp) ? forwardedIp : "shared-local";
    const clientKey = createHmac("sha256", secret).update(clientIp).digest("hex");
    const response = await fetch(scriptUrl, {
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        organization,
        secret,
        clientKey,
      }),
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      method: "POST",
      redirect: "follow",
      signal: AbortSignal.timeout(45_000),
    });
    const responseText = await response.text();
    const normalizedResponse = responseText.trim();

    if (!response.ok) {
      failureCode = `UPSTREAM_HTTP_${response.status}`;
      throw new Error(`Google Apps Script returned HTTP ${response.status}.`);
    }

    if (normalizedResponse !== "SUCCESS") {
      failureCode = "INVALID_UPSTREAM_RESPONSE";
      const result = JSON.parse(normalizedResponse) as {
        code?: string;
        ok?: boolean;
        retryAfter?: number;
      };

      if (result?.code === "RATE_LIMITED") {
        const retryAfter = typeof result.retryAfter === "number" && Number.isFinite(result.retryAfter)
          ? Math.max(1, Math.min(86400, Math.ceil(result.retryAfter))) : 600;
        return NextResponse.json(
          { message: "Too many signup attempts. Please try again later." },
          { status: 429, headers: { "Retry-After": String(retryAfter) } },
        );
      }
      if (result?.ok !== true) {
        const knownCodes = ["INVALID", "UNAUTHORIZED", "BUSY", "UNAVAILABLE"];
        failureCode = result?.code && knownCodes.includes(result.code)
          ? `APPS_SCRIPT_${result.code}` : "UPSTREAM_REJECTED";
        throw new Error("Google Apps Script rejected the signup.");
      }
    }

    return NextResponse.json(
      { message: "Thank you. You have joined the mailing list." },
      { status: 201 },
    );
  } catch (error) {
    // Do not log the upstream body, email address, URL, or shared secret.
    console.error("Newsletter signup failed:", failureCode, error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json(
      { message: "We could not confirm your signup. Please try again; your email will only be added once." },
      { status: 502 },
    );
  }
}
