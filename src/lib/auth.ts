import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function getSession() {
  return await getServerSession(authOptions);
}

export function withAuth(handler: Function) {
  return async (req: Request, ...args: any[]) => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(req, session, ...args);
  };
}
