import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const GET = async (request: NextRequest) => {
  try {
    // Get the URL from the query parameter
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Decode the URL to handle any encoded characters
    const decodedUrl = decodeURIComponent(url);

    // Extract the access token from the session
    const token = await getToken({ req: request });
    const accessToken = token?.user?.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Fetch the audio file from Firebase Storage with the user's token
    const response = await fetch(decodedUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // Add Firebase Storage headers
        Origin: request.nextUrl.origin,
      },
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch audio: ${response.status} ${response.statusText}`
      );

      // For debugging - log headers
      const responseHeaders = Object.fromEntries(response.headers.entries());
      console.error("Response headers:", responseHeaders);

      return NextResponse.json(
        { error: `Failed to fetch audio: ${response.statusText}` },
        { status: response.status }
      );
    }

    // Get the audio data as an array buffer
    const audioData = await response.arrayBuffer();

    // Get the content type from the response
    const contentType = response.headers.get("content-type") || "audio/mpeg";

    // Create a new response with the audio data
    return new NextResponse(audioData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": audioData.byteLength.toString(),
        "Cache-Control": "public, max-age=31536000", // Cache for a year
      },
    });
  } catch (error) {
    console.error("Error proxying audio request:", error);
    return NextResponse.json(
      { error: "Failed to proxy audio request" },
      { status: 500 }
    );
  }
};
