import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8888";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${BACKEND_URL}/subscriptions/plans`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
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
    console.error("Subscription plans API error:", error);
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
