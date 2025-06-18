import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "URL parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Call the backend to get signed URL
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/songs/get-signed-url`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get signed URL");
    }

    const data = await response.json();

    if (data.signedUrl) {
      // Proxy the image
      const imageResponse = await fetch(data.signedUrl);

      if (!imageResponse.ok) {
        throw new Error("Failed to fetch image");
      }

      const imageBuffer = await imageResponse.arrayBuffer();

      return new NextResponse(imageBuffer, {
        headers: {
          "Content-Type":
            imageResponse.headers.get("Content-Type") || "image/jpeg",
          "Cache-Control": "public, max-age=3600",
        },
      });
    } else {
      throw new Error("No signed URL received");
    }
  } catch (error) {
    console.error("Error proxying cover image:", error);
    return NextResponse.json(
      { error: "Failed to load image" },
      { status: 500 }
    );
  }
}
