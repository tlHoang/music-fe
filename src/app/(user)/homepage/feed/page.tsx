"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { sendRequest } from "@/utils/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { usePlayer } from "@/components/app/player-context";

interface User {
  _id: string;
  name?: string;
  username: string;
  avatar?: string;
}

interface Track {
  _id: string;
  title: string;
  audioUrl: string;
  visibility: string;
  userId: string;
  user: User;
  duration: number;
  uploadDate: string;
  plays?: number;
  likes?: number;
  genre?: string;
}

const FeedPage = () => {
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { playTrack } = usePlayer();

  // console.log(tracks);

  useEffect(() => {
    if (session?.user?.access_token) {
      fetchFeedTracks();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchFeedTracks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/songs/feed`,
        headers: {
          Authorization: `Bearer ${session?.user?.access_token}`,
        },
        method: "GET",
      });

      if (response.data) {
        setTracks(response.data);
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
      setError("Failed to load your feed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handlePlayTrack = (track: Track) => {
    if (playTrack) {
      const audioUrl = track.audioUrl.startsWith("/api/audio")
        ? track.audioUrl
        : `/api/audio?url=${encodeURIComponent(track.audioUrl)}`;

      playTrack({
        ...track,
        audioUrl,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        {/* <p className="text-xl">Loading your feed...</p> */}
        <p className="text-xl"></p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
          Please log in to see your social feed.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Your Feed</h1>
          <p className="text-gray-600">
            Check out the latest tracks from people you follow
          </p>
        </div>
        <Link href="/discover">
          <Button variant="outline">Discover More Artists</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {tracks.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-4">Your feed is empty</h2>
          <p className="text-gray-600 mb-6">
            Follow some artists to see their latest tracks here!
          </p>
          <Link href="/discover">
            <Button>Discover Artists</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tracks.map((track) => (
            <div
              key={track._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div
                className="h-48 bg-gray-200 flex items-center justify-center cursor-pointer"
                onClick={() => handlePlayTrack(track)}
              >
                <div className="w-16 h-16 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3
                    className="font-semibold text-lg cursor-pointer hover:text-blue-600 truncate"
                    onClick={() => handlePlayTrack(track)}
                  >
                    {track.title}
                  </h3>
                  {track.genre && (
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {track.genre}
                    </span>
                  )}
                </div>

                {/* <Link href={`/profile/${String(track.userId)}`} className="flex items-center mb-3"> */}
                <Link
                  href={`/profile/${track.user._id}`}
                  className="flex items-center mb-3"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                    <Image
                      src={track.user?.avatar || "/default-profile.jpg"}
                      alt={track.user?.name || "Artist"}
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <span className="text-sm text-gray-700 hover:underline">
                    {track.user?.name ||
                      track.user?.username ||
                      "Unknown Artist"}
                  </span>
                </Link>

                <div className="flex justify-between text-xs text-gray-500">
                  <span>{formatDuration(track.duration)}</span>
                  <span>{formatDate(track.uploadDate)}</span>
                </div>

                <div className="flex justify-between mt-4 text-xs text-gray-500">
                  <span>{track.plays || 0} plays</span>
                  <span>{track.likes || 0} likes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedPage;
