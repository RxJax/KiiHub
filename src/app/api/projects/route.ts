import { NextResponse } from "next/server";
import { getProjects, upsertProject, incrementProjectVisits } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getProjects();
    return NextResponse.json(data, {
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
    
    // Support incrementing visits
    if (body.projectId && typeof body.amount === "number") {
      await incrementProjectVisits(body.projectId, body.amount);
      return NextResponse.json({ success: true });
    }
    
    const { id, name, description, githubUrl, demoUrl, visits, submittedAt, userAddress, username } = body;
    
    if (!id || !name || !userAddress) {
      return NextResponse.json({ error: "id, name, and userAddress are required" }, { status: 400 });
    }
    
    await upsertProject({
      id,
      name,
      description,
      githubUrl,
      demoUrl,
      visits: Number(visits) || 0,
      submittedAt: Number(submittedAt) || Date.now(),
      userAddress: userAddress.toLowerCase(),
      username
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
