"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserRound, Music, Users } from "lucide-react";

interface Artist {
  _id: string;
  name?: string;
  username: string;
  profilePicture?: string;
  followerCount?: number;
  trackCount?: number;
}

export default function ArtistRecommendations() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    const fetchPopularArtists = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching popular artists from API");

        // Try to fetch from API first
        let apiSuccess = false;
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/users/popular`,
            {
              // Adding timeout to prevent hanging if API is down
              signal: AbortSignal.timeout(5000),
              // Add credentials to handle authentication properly
              credentials: "include",
            }
          );

          if (!response.ok) {
            console.log(
              "Popular artists API returned status:",
              response.status
            );
            // Log specific error type for debugging
            if (response.status === 401) {
              console.log(
                "Authentication error when fetching artists - user likely not logged in"
              );
            }
            throw new Error(`API error: ${response.status}`);
          }

          const result = await response.json();

          if (result.success && result.data && result.data.length > 0) {
            setArtists(result.data.slice(0, 5)); // Limit to 5 artists
            console.log("Popular artists loaded:", result.data.length);
            apiSuccess = true;
          } else {
            console.log("API response format unexpected or empty:", result);
            throw new Error("API returned no data");
          }
        } catch (apiError: any) {
          console.error(
            "API error when fetching artists:",
            apiError.message || apiError
          );
          // Will continue to fallback data
        }

        // If API call wasn't successful, use demo data
        if (!apiSuccess) {
          console.log("Using demo artist data instead");
          const demoArtists = [
            {
              _id: "artist1",
              name: "Electronic Beats",
              username: "electronicbeats",
              profilePicture: "https://source.unsplash.com/random/300x300/?dj",
              followerCount: 12500,
              trackCount: 42,
            },
            {
              _id: "artist2",
              name: "Jazz Master",
              username: "jazzmaster",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?jazz",
              followerCount: 8200,
              trackCount: 29,
            },
            {
              _id: "artist3",
              name: "Rock Legend",
              username: "rocklegend",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?rock",
              followerCount: 15600,
              trackCount: 38,
            },
            {
              _id: "artist4",
              name: "Classical Virtuoso",
              username: "classicalvirtuoso",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?orchestra",
              followerCount: 6800,
              trackCount: 21,
            },
            {
              _id: "artist5",
              name: "Hip Hop Flow",
              username: "hiphopflow",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?hiphop",
              followerCount: 22100,
              trackCount: 56,
            },
          ];
          setArtists(demoArtists);
        }
      } catch (error: any) {
        console.error(
          "Error in artist recommendation component:",
          error.message || error
        );
        // Don't set the error state since we'll always show fallback data
        // setError("Could not load artist recommendations");

        // Enhanced fallback data with more variety for a better user experience
        const errorType = error?.message || "";
        console.log(`Using demo artists due to error: ${errorType}`);

        // Always provide fallback data, even in case of unexpected errors
        const demoArtists = [
          {
            _id: "artist1",
            name: "Electronic Beats",
            username: "electronicbeats",
            profilePicture: "https://source.unsplash.com/random/300x300/?dj",
            followerCount: 12500,
            trackCount: 42,
          },
          {
            _id: "artist2",
            name: "Jazz Master",
            username: "jazzmaster",
            profilePicture: "https://source.unsplash.com/random/300x300/?jazz",
            followerCount: 8200,
            trackCount: 29,
          },
          {
            _id: "artist3",
            name: "Rock Legend",
            username: "rocklegend",
            profilePicture: "https://source.unsplash.com/random/300x300/?rock",
            followerCount: 15600,
            trackCount: 38,
          },
          {
            _id: "artist4",
            name: "Hip Hop King",
            username: "hiphopking",
            profilePicture:
              "https://source.unsplash.com/random/300x300/?rapper",
            followerCount: 18700,
            trackCount: 45,
          },
          {
            _id: "artist5",
            name: "Pop Sensation",
            username: "popsensation",
            profilePicture:
              "https://source.unsplash.com/random/300x300/?singer",
            followerCount: 24300,
            trackCount: 36,
          },
        ];
        setArtists(demoArtists);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularArtists();
  }, []);

  const handleImageError = (artistId: string) => {
    setImageErrors((prev) => ({ ...prev, [artistId]: true }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Artists You Might Like</h2>
          <Button variant="ghost" disabled>
            View All
          </Button>
        </div>
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="flex-shrink-0 w-40">
                <Skeleton className="h-40 w-40 rounded-full mb-3" />
                <Skeleton className="h-5 w-24 mx-auto mb-1" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
        </div>
      </div>
    );
  }
  // Even if there's an error, we'll show the section if we have fallback data
  if (artists.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
            <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold">Artists You Might Like</h2>
        </div>
        <Link href="/discover/artists">
          <Button variant="ghost">View All</Button>
        </Link>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
        {artists.map((artist) => (
          <Link
            key={artist._id}
            href={`/profile/${artist._id}`}
            className="flex-shrink-0 w-40 text-center group"
          >
            <div className="relative mx-auto mb-3 w-40 h-40 rounded-full overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/50 group-hover:border-indigo-300 dark:group-hover:border-indigo-700 transition-colors">
              {artist.profilePicture && !imageErrors[artist._id] ? (
                <Image
                  src={artist.profilePicture}
                  alt={artist.name || artist.username}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(artist._id)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                  <UserRound className="h-16 w-16 text-indigo-300 dark:text-indigo-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="font-semibold text-lg mb-1 truncate">
              {artist.name || artist.username}
            </h3>
            <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
              <Music size={14} className="mr-1" />
              <span>{artist.trackCount || 0} tracks</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
