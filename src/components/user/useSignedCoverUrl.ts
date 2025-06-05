import { useEffect, useState } from "react";

export function useSignedCoverUrl(coverUrl?: string) {
  const [signedUrl, setSignedUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!coverUrl) {
      setSignedUrl(undefined);
      return;
    }
    // Call backend to get signed url
    fetch(`/api/songs/get-signed-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: coverUrl }),
    })
      .then((res) => res.json())
      .then((data) => setSignedUrl(data.signedUrl || coverUrl))
      .catch(() => setSignedUrl(coverUrl));
  }, [coverUrl]);

  return signedUrl;
}
