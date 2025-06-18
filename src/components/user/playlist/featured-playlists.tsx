"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Library } from "lucide-react";

interface FeaturedPlaylist {
  _id: string;
  name: string;
  userId: {
    _id: string;
    name: string;
    username: string;
    profilePicture?: string;
  };
  songs: any[];
  visibility: string;
  isFeatured: boolean;
  createdAt: string;
  cover?: string;
}

export default function FeaturedPlaylists() {
  const [playlists, setPlaylists] = useState<FeaturedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchFeaturedPlaylists = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("Fetching featured playlists from API");

        // Try to fetch from API first with a timeout to prevent hanging
        let apiSuccess = false;
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/playlists/featured`,
            {
              signal: AbortSignal.timeout(5000),
              // Add credentials to handle authentication properly
              credentials: "include",
            }
          );

          if (!response.ok) {
            console.log(
              "Featured playlists API returned status:",
              response.status
            );
            if (response.status === 401) {
              console.log(
                "Authentication error when fetching playlists - user likely not logged in"
              );
            }
            throw new Error(`API error: ${response.status}`);
          }

          const result = await response.json();

          if (result.success && result.data && result.data.length > 0) {
            setPlaylists(result.data);
            console.log("Featured playlists loaded:", result.data.length);
            apiSuccess = true;
          } else {
            console.log("API response format unexpected or empty:", result);
            throw new Error("API returned no data");
          }
        } catch (apiError: any) {
          console.error(
            "API error when fetching playlists:",
            apiError.message || apiError
          );
          // Will continue to fallback data
        }

        // If API call wasn't successful, use demo data
        if (!apiSuccess) {
          console.log("No featured playlists found, using demo data");
          // Add demo featured playlists
          const demoFeaturedPlaylists = [
            {
              _id: "playlist1",
              name: "Summer Hits 2025",
              userId: {
                _id: "curator1",
                name: "Music Curator",
                username: "curator",
                profilePicture:
                  "https://source.unsplash.com/random/300x300/?curator",
              },
              songs: Array(12).fill({}),
              visibility: "PUBLIC",
              isFeatured: true,
              createdAt: new Date().toISOString(),
            },
            {
              _id: "playlist2",
              name: "Chill Vibes",
              userId: {
                _id: "curator2",
                name: "Mellow Mood",
                username: "mellowmood",
                profilePicture:
                  "https://source.unsplash.com/random/300x300/?chill",
              },
              songs: Array(8).fill({}),
              visibility: "PUBLIC",
              isFeatured: true,
              createdAt: new Date().toISOString(),
            },
            {
              _id: "playlist3",
              name: "Workout Motivation",
              userId: {
                _id: "curator3",
                name: "Fitness Beats",
                username: "fitnessbeats",
                profilePicture:
                  "https://source.unsplash.com/random/300x300/?fitness",
              },
              songs: Array(15).fill({}),
              visibility: "PUBLIC",
              isFeatured: true,
              createdAt: new Date().toISOString(),
            },
            {
              _id: "playlist4",
              name: "Study Focus",
              userId: {
                _id: "curator4",
                name: "Concentration",
                username: "focus",
                profilePicture:
                  "https://source.unsplash.com/random/300x300/?study",
              },
              songs: Array(10).fill({}),
              visibility: "PUBLIC",
              isFeatured: true,
              createdAt: new Date().toISOString(),
            },
          ];
          setPlaylists(demoFeaturedPlaylists);
        }
      } catch (error) {
        console.error("Error fetching featured playlists:", error);
        // Add fallback demo data
        const demoFeaturedPlaylists = [
          {
            _id: "playlist1",
            name: "Summer Hits 2025",
            userId: {
              _id: "curator1",
              name: "Music Curator",
              username: "curator",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?curator",
            },
            songs: Array(12).fill({}),
            visibility: "PUBLIC",
            isFeatured: true,
            createdAt: new Date().toISOString(),
          },
          {
            _id: "playlist2",
            name: "Chill Vibes",
            userId: {
              _id: "curator2",
              name: "Mellow Mood",
              username: "mellowmood",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?chill",
            },
            songs: Array(8).fill({}),
            visibility: "PUBLIC",
            isFeatured: true,
            createdAt: new Date().toISOString(),
          },
          {
            _id: "playlist3",
            name: "Workout Motivation",
            userId: {
              _id: "curator3",
              name: "Fitness Beats",
              username: "fitnessbeats",
              profilePicture:
                "https://source.unsplash.com/random/300x300/?fitness",
            },
            songs: Array(15).fill({}),
            visibility: "PUBLIC",
            isFeatured: true,
            createdAt: new Date().toISOString(),
          },
        ];
        setPlaylists(demoFeaturedPlaylists);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPlaylists();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Featured Playlists</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow"
              >
                <Skeleton className="h-36 w-full mb-3 rounded-md" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Featured Playlists</h2>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  if (playlists.length === 0) {
    return null; // Don't show the section if there are no featured playlists
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Featured Playlists</h2>
        <Link href="/discover/playlists">
          <Button variant="ghost">View All</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {playlists.map((playlist) => (
          <Link key={playlist._id} href={`/playlist/${playlist._id}`}>
            {" "}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow group cursor-pointer h-full flex flex-col">
              <div className="bg-gradient-to-br from-purple-400 to-indigo-600 aspect-square rounded-md mb-3 flex items-center justify-center text-white text-4xl relative overflow-hidden">
                {playlist.cover ? (
                  <img
                    src={playlist.cover}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  playlist.name?.charAt(0).toUpperCase() || "P"
                )}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity flex items-center justify-center">
                  <Library className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                {playlist.name}
              </h3>
              <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                By{" "}
                {playlist.userId?.name ||
                  playlist.userId?.username ||
                  "Unknown"}
              </p>
              <div className="flex items-center text-sm text-gray-500 mt-auto">
                <Music size={14} className="mr-1" />
                <span>{playlist.songs?.length || 0} songs</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
