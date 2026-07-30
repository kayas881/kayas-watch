import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const isDownFile = path.join(process.cwd(), ".test-down");
  const isDown = fs.existsSync(isDownFile);
  
  if (isDown) {
    return NextResponse.json({ error: "Service Unavailable" }, { status: 500 });
  }
  
  return NextResponse.json({ status: "OK" }, { status: 200 });
}
