import { NextResponse } from "next/server";
import { getLeaderboard, upsertUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rawData = await getLeaderboard();
    const data = Array.isArray(rawData) ? rawData : [];
    
    // Serialization & Privacy Check: return correct public profile data 
    // (wallet address/handle, Level, and XP, along with public avatar/title/contracts)
    // while keeping sensitive account details private.
    const serialized = data.map((user) => ({
      address: user ? user.address : "",
      name: user ? user.username : "",
      avatar: (user && user.avatar) || "🚀",
      title: (user && user.title) || "Newcomer",
      level: user?.level ?? 1,
      xp: user?.total_xp ?? 0,
      contracts: user?.contracts ?? 0
    }));

    return NextResponse.json(serialized, {
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
    
    // Support bulk sync (array of users)
    if (Array.isArray(body)) {
      for (const item of body) {
        const { address, name, avatar, title, level, xp, contracts } = item;
        if (address && name) {
          await upsertUser({
            address: address.toLowerCase(),
            username: name,
            avatar: avatar || "🚀",
            title: title || "Newcomer",
            level: Number(level) || 1,
            total_xp: Number(xp) || 0,
            contracts: Number(contracts) || 0
          });
        }
      }
      return NextResponse.json({ success: true, count: body.length });
    }

    // Support single user sync
    const { address, name, avatar, title, level, xp, contracts } = body;

    if (!address || !name) {
      return NextResponse.json({ error: "Address and Name are required" }, { status: 400 });
    }

    await upsertUser({
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
