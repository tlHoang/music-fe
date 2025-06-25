import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { IUser } from "@/types/next-auth";

export async function POST(request: NextRequest) {
  try {
    console.log("=== Payment API Route Debug Info ===");

    // Get the session using the auth function
    const session = await auth();

    if (!session || !session.user) {
      console.log("No session found");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log("Session found for user:", session.user.email);

    // Extract the access token from the session
    const accessToken = (session.user as IUser).access_token;

    if (!accessToken) {
      console.log("No access token in session");
      return NextResponse.json(
        { error: "No access token available" },
        { status: 401 }
      );
    }

    console.log(
      "Access token found (first 50 chars):",
      accessToken.substring(0, 50) + "..."
    );

    // Get request body
    const body = await request.json();
    console.log("Request body:", body);

    // Forward request to backend with the actual JWT access token
    const backendResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/payments/create-subscription`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    console.log("Backend response status:", backendResponse.status);
    const responseData = await backendResponse.json();
    console.log("Backend response data:", responseData);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: responseData.message || "Payment creation failed" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
