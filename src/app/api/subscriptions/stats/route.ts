import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8888";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const response = await fetch(`${BACKEND_URL}/subscriptions/stats`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorResult.message || `Backend error: ${response.status}`,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Subscription stats API error:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
