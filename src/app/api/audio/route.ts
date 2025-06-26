import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL parameter is required" },
        { status: 400 }
      );
    }

    const decodedUrl = decodeURIComponent(url);
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    if (!token?.user?.access_token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );    }

    const signedUrlResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/songs/get-signed-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.user.access_token}`,
        },
        body: JSON.stringify({ url: decodedUrl }),
      }
    );

    if (!signedUrlResponse.ok) {
      return NextResponse.json(
        { error: `Failed to get signed URL: ${signedUrlResponse.statusText}` },
        { status: signedUrlResponse.status }
      );    }

    const responseData = await signedUrlResponse.json();
    const signedUrl = responseData.data?.signedUrl;

    if (!signedUrl) {
      return NextResponse.json(
        { error: "No signed URL returned from the server" },
        { status: 500 }
      );    }

    try {
      new URL(signedUrl);

      const response = await fetch(signedUrl);

      if (!response.ok) {
        console.error(
          `Error fetching audio: ${response.status} ${response.statusText}`
        );
        return NextResponse.json(
          { error: `Failed to fetch audio: ${response.statusText}` },
          { status: response.status }
        );      }

      const audioData = await response.arrayBuffer();

      const contentType = response.headers.get("content-type") || "audio/mpeg";

      return new NextResponse(audioData, {
        status: 200,        headers: {
          "Content-Type": contentType,
          "Content-Length": audioData.byteLength.toString(),
          "Cache-Control": "public, max-age=31536000",
        },
      });
    } catch (urlError: any) {
      console.error("Invalid URL provided:", signedUrl, urlError);
      return NextResponse.json(
        { error: `Invalid URL format: ${urlError.message}` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error proxying audio request:", error);
    return NextResponse.json(
      { error: `Failed to proxy audio request: ${error.message}` },
      { status: 500 }
    );
  }
}
