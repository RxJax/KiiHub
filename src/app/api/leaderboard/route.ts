import { NextResponse } from "next/server";
import { getLeaderboard, upsertUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = getLeaderboard();
    
    // Serialization & Privacy Check: return correct public profile data 
    // (wallet address/handle, Level, and XP, along with public avatar/title/contracts)
    // while keeping sensitive account details private.
    const serialized = data.map((user) => ({
      address: user.address,
      name: user.username,
      avatar: user.avatar,
      title: user.title,
      level: user.level,
      xp: user.total_xp,
      contracts: user.contracts
    }));

    return NextResponse.json(serialized);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, name, avatar, title, level, xp, contracts } = body;

    if (!address || !name) {
      return NextResponse.json({ error: "Address and Name are required" }, { status: 400 });
    }

    upsertUser({
      address: address.toLowerCase(),
      username: name,
      avatar: avatar || "🚀",
      title: title || "Newcomer",
      level: Number(level) || 1,
      total_xp: Number(xp) || 0,
      contracts: Number(contracts) || 0
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
