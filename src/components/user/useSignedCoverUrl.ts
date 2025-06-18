import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function useSignedCoverUrl(coverUrl?: string) {
  const { data: session } = useSession();
  const [signedUrl, setSignedUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!coverUrl) {
      console.log("No cover URL provided");
      setSignedUrl(undefined);
      return;
    }

    console.log("Processing cover URL:", coverUrl);

    // If the URL is not from Google Cloud Storage, use it directly
    if (!coverUrl.includes("storage.googleapis.com")) {
      console.log("Using direct URL (not Google Cloud Storage)");
      setSignedUrl(coverUrl);
      return;
    }

    console.log("Fetching signed URL for Google Cloud Storage");
    // Call backend to get signed url for Firebase Storage URLs
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/songs/get-signed-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.user?.access_token
          ? { Authorization: `Bearer ${session.user.access_token}` }
          : {}),
      },
      body: JSON.stringify({ url: coverUrl }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Signed URL response:", data);
        setSignedUrl(data.signedUrl || coverUrl);
      })
      .catch((error) => {
        console.error("Error fetching signed URL:", error);
        setSignedUrl(coverUrl);
      });
  }, [coverUrl, session?.user?.access_token]);

  return signedUrl;
}
