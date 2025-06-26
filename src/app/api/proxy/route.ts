import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export const GET = async (request: NextRequest) => {
  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    const decodedUrl = decodeURIComponent(url);

    const token = await getToken({ req: request });
    const accessToken = token?.user?.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const response = await fetch(decodedUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Origin: request.nextUrl.origin,
      },
    });

    if (!response.ok) {      console.error(
        `Failed to fetch audio: ${response.status} ${response.statusText}`
      );

      const responseHeaders = Object.fromEntries(response.headers.entries());
      console.error("Response headers:", responseHeaders);

      return NextResponse.json(
        { error: `Failed to fetch audio: ${response.statusText}` },
        { status: response.status }
      );
    }

    const audioData = await response.arrayBuffer();

    const contentType = response.headers.get("content-type") || "audio/mpeg";

    return new NextResponse(audioData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": audioData.byteLength.toString(),
        "Cache-Control": "public, max-age=31536000",
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
