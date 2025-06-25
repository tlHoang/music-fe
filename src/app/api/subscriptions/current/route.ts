import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { IUser } from "@/types/next-auth";

export async function GET() {
  try {
    // Get the session using the auth function
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Extract the access token from the session
    const accessToken = (session.user as IUser).access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token available" },
        { status: 401 }
      );
    }

    // Get current subscription from backend
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/current`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(
        { error: errorData.message || "Failed to get subscription" },
        { status: backendResponse.status }
      );
    }

    const subscriptionData = await backendResponse.json();
    return NextResponse.json(subscriptionData);
  } catch (error) {
    console.error("Subscription API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
