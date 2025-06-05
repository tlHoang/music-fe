import { sendRequest } from "../../utils/api";
import { Session } from "next-auth";

export async function savePlaybackSession({
  userId,
  trackId,
  position,
  duration,
  deviceType = "web",
  accessToken,
}: {
  userId: string;
  trackId: string;
  position: number;
  duration: number;
  deviceType?: string;
  accessToken: string;
}) {
  return sendRequest({
    url: `${process.env.NEXT_PUBLIC_API_URL}/playback/session`,
    method: "POST",
    body: { userId, trackId, position, duration, deviceType },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
}

export async function getPlaybackSession({
  userId,
  trackId,
  deviceType = "web",
  accessToken,
}: {
  userId: string;
  trackId: string;
  deviceType?: string;
  accessToken: string;
}): Promise<IBackendRes<any>> {
  return sendRequest({
    url: `${process.env.NEXT_PUBLIC_API_URL}/playback/session`,
    method: "GET",
    queryParams: { userId, trackId, deviceType },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
}
