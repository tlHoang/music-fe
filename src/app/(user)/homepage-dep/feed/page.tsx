"use client";
import React, { useEffect, useState } from "react";
import { usePlayer } from "@/components/app/player-context";
import { Button } from "@/components/ui/button";
import { Play, Pause, MoreHorizontal } from "lucide-react";

export default function FeedPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: string }>({});
  const { playTrack, currentTrack, isPlaying } = usePlayer();

  // Helper to get cover image URL
  const getCoverImage = (track: any) => {
    const url = track.coverImage || track.cover || "/default-profile.jpg";
    return url;
  };

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/homepage/feed`)
      .then((res) => res.json())
      .then((data) => {
        setTracks(data.data || []);
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto mt-8">
      {/* Hero Banner */}
      <div className="relative w-full h-48 mb-10 rounded-2xl overflow-hidden shadow-lg">
        <img
          src="/hero-banner.jpg"
          alt="Hero Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
          <h1 className="text-4xl font-extrabold drop-shadow mb-2">
            Welcome to SoundCloud Clone
          </h1>
          <p className="text-lg font-medium drop-shadow">
            Discover trending music and artists
          </p>
        </div>
      </div>
      {/* Decorative pattern overlay */}
      <img
        src="/pattern.png"
        alt="Pattern"
        className="absolute top-0 right-0 w-40 h-40 opacity-20 pointer-events-none select-none z-0 rotate-12"
        aria-hidden="true"
      />
      {/* Feed content */}
      <div className="relative z-10">
        <h2 className="text-3xl font-extrabold mb-8 flex items-center gap-3">
          <img src="/next.svg" alt="Trending" className="w-8 h-8" /> Trending
          Tracks
        </h2>
        {/* Debug display */}
        {Object.keys(imageErrors).length > 0 && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <h3 className="text-md font-semibold text-red-700 dark:text-red-400 mb-2">
              Image loading issues:
            </h3>
            <ul className="list-disc list-inside">
              {Object.entries(imageErrors).map(([trackId, error]) => (
                <li
                  key={trackId}
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}
        {loading ? (
          <div className="text-center py-10 text-muted-foreground">
            Loading tracks...
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {tracks.map((track) => (
              <div
                key={track._id}
                className="flex items-center gap-4 bg-white/90 dark:bg-neutral-900/80 rounded-xl shadow-lg p-4 hover:shadow-2xl transition-shadow relative group border border-neutral-200 dark:border-neutral-800 backdrop-blur-md"
              >
                <div className="relative">
                  <img
                    src={getCoverImage(track)}
                    alt={track.title || "Track cover"}
                    className="w-20 h-20 rounded-lg object-cover shadow-md border-2 border-neutral-200 dark:border-neutral-800 bg-neutral-200 dark:bg-neutral-800"
                    onError={(e) => {
                      e.currentTarget.src = "/default-profile.jpg";
                      setImageErrors((prev) => ({
                        ...prev,
                        [track._id]: `Failed to load image for "${track.title}". URL: ${getCoverImage(track).substring(0, 50)}...`,
                      }));
                    }}
                  />
                  <span className="absolute bottom-1 right-1 bg-white/80 dark:bg-neutral-900/80 text-xs px-2 py-0.5 rounded-full shadow text-muted-foreground">
                    {track.genre || "Unknown"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate text-lg">
                      {track.title}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {track.artist}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="inline-block w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-purple-400 mr-1" />
                      {track.genre || "Unknown Genre"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {track.playCount || 0} plays
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {track.uploadDate
                        ? new Date(track.uploadDate).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  <img
                    src="/waveform.png"
                    alt="Waveform"
                    className="mt-2 w-full h-6 object-cover opacity-60 rounded"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant={
                      currentTrack?._id === track._id && isPlaying
                        ? "secondary"
                        : "outline"
                    }
                    onClick={() => playTrack(track)}
                    className="rounded-full shadow-md hover:scale-110 transition-transform"
                  >
                    {currentTrack?._id === track._id && isPlaying ? (
                      <Pause />
                    ) : (
                      <Play />
                    )}
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <img
                      src="/avatar-default.png"
                      alt="Like"
                      className="w-5 h-5 rounded-full"
                    />
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
