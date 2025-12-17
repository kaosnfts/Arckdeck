import { NextResponse } from "next/server";
import { isAddress, getAddress } from "viem";
import { env } from "@/lib/env";


export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get("address")?.trim() ?? "";
  const limit = Math.min(500, Math.max(1, Number(url.searchParams.get("limit") ?? 200)));

  if (!isAddress(address)) {
    return NextResponse.json({ status: "0", message: "INVALID_ADDRESS", result: [] }, { status: 400 });
  }

  const checksum = getAddress(address);
  const api = env.ARC_EXPLORER_API.replace(/\/$/, "");
  const qs = new URLSearchParams({
    module: "account",
    action: "txlist",
    address: checksum,
    startblock: "0",
    endblock: "99999999",
    page: "1",
    offset: String(limit),
    sort: "asc",
  });

  const target = `${api}?${qs.toString()}`;

  try {
    const r = await fetch(target, {
      headers: { "accept": "application/json" },
      // No caching: we want "near real-time"
      cache: "no-store",
    });
    const text = await r.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      json = { status: "0", message: "BAD_JSON", result: [], raw: text };
    }

    return NextResponse.json(json, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { status: "0", message: e?.message || "EXPLORER_FETCH_FAILED", result: [] },
      { status: 502 }
    );
  }
}
