import { NextResponse } from "next/server";
import { getActivities, insertActivity } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rawData = await getActivities();
    return NextResponse.json(rawData, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hash, type, timestamp, status, userAddress, blockNumber, details, xpEarned, gamePlayed } = body;

    if (!hash || !type || !userAddress) {
      return NextResponse.json({ error: "Hash, Type, and UserAddress are required" }, { status: 400 });
    }

    await insertActivity({
      hash,
      type,
      timestamp: Number(timestamp) || Date.now(),
      status,
      user_address: userAddress,
      block_number: blockNumber ? Number(blockNumber) : undefined,
      details,
      xp_earned: xpEarned ? Number(xpEarned) : 0,
      game_played: gamePlayed
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
