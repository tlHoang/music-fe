"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { sendRequest } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Music,
  Library,
  Play,
  Pause,
  Users,
  TrendingUp,
  Heart,
  Disc3,
  Headphones,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayer } from "@/components/app/player-context";
import { useSignedCoverUrl } from "@/components/user/useSignedCoverUrl";

interface Track {
  _id: string;
  title: string;
  audioUrl: string;
  visibility: string;
  userId: {
    _id: string;
    username: string;
    name?: string;
  };
  duration: number;
  uploadDate: string;
  playCount?: number;
  genres?: string[];
  cover?: string;
  likeCount?: number;
  commentCount?: number;
}

interface User {
  _id: string;
  name?: string;
  email: string;
  avatar?: string;
  followersCount: number;
  tracksCount: number;
  isFollowing?: boolean;
}

interface Playlist {
  _id: string;
  name: string;
  userId: {
    _id: string;
    name: string;
    username: string;
    profilePicture?: string;
  };
  songs: string[];
  visibility: string;
  isFeatured: boolean;
  createdAt: string;
  followersCount?: number;
  cover?: string;
}

// Compact Track Card for featured sections
const FeaturedTrackCard = ({
  track,
  handlePlayToggle,
  currentTrack,
  isPlaying,
}: {
  track: Track;
  handlePlayToggle: (track: Track) => void;
  currentTrack: any;
  isPlaying: boolean;
}) => {
  // Use the signed cover URL directly from the backend API response
  const coverImageUrl = track.cover;

  // Debug logging
  React.useEffect(() => {
    console.log("=== Track Debug Info ===");
    console.log("Track ID:", track._id);
    console.log("Track title:", track.title);
    console.log(
      "Track cover (should be signed URL from backend):",
      track.cover
    );
    console.log("========================");
  }, [track._id, track.cover]);

  return (
    <div className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
      {" "}
      <div className="relative w-16 h-16 flex-shrink-0">
        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-600 dark:text-gray-400 text-sm font-medium overflow-hidden">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={track.title}
              fill
              className="object-cover rounded-md"
            />
          ) : track.title ? (
            <span className="text-xs font-semibold">
              {track.title.charAt(0).toUpperCase()}
            </span>
          ) : (
            <Music size={16} />
          )}
        </div>
        {/* Play button overlay */}
        <div
          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            handlePlayToggle(track);
          }}
        >
          {currentTrack?._id === track._id && isPlaying ? (
            <Pause size={16} className="text-white" />
          ) : (
            <Play size={16} className="text-white" />
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <Link href={`/track/${track._id}`}>
          <h4 className="font-medium text-sm line-clamp-1 hover:text-blue-600 transition-colors">
            {track.title}
          </h4>
        </Link>
        <Link href={`/profile/${track.userId?._id}`}>
          <p className="text-xs text-gray-500 line-clamp-1 hover:text-gray-700 transition-colors">
            {track.userId?.name || track.userId?.username || "Unknown Artist"}
          </p>
        </Link>
      </div>
      <div className="text-xs text-gray-400">
        {Math.floor(track.duration / 60)}:
        {String(Math.floor(track.duration % 60)).padStart(2, "0")}
      </div>
    </div>
  );
};

// Featured Artist Card
const FeaturedArtistCard = ({ user }: { user: User }) => {
  const signedAvatarUrl = useSignedCoverUrl(user.avatar);

  return (
    <Link href={`/profile/${user._id}`}>
      <div className="group bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] text-center">
        {" "}
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xl font-semibold overflow-hidden">
          {signedAvatarUrl ? (
            <Image
              src={signedAvatarUrl}
              alt={user.name || user.email}
              width={64}
              height={64}
              className="rounded-full object-cover"
            />
          ) : (
            (user.name?.charAt(0) || user.email.charAt(0)).toUpperCase()
          )}
        </div>
        <h4 className="font-medium text-sm mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {user.name || user.email}
        </h4>
        <p className="text-xs text-gray-500">
          {user.followersCount || 0} followers
        </p>
      </div>
    </Link>
  );
};

const HomePage = () => {
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState({
    tracks: true,
    users: true,
    playlists: true,
  });
  const [searchQuery, setSearchQuery] = useState("");

  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();

  useEffect(() => {
    fetchTracks();
    fetchUsers();
    fetchPlaylists();
  }, [session]);

  const fetchTracks = async () => {
    try {
      setLoading((prev) => ({ ...prev, tracks: true }));

      const response = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/songs/search?visibility=PUBLIC&limit=12`,
        method: "GET",
        headers: session?.user?.access_token
          ? { Authorization: `Bearer ${session.user.access_token}` }
          : {},
      });

      if (response.data) {
        // response.data is the songs array
        const tracksArray: Track[] = Array.isArray(response.data)
          ? response.data
          : response.data.data && Array.isArray(response.data.data)
          ? response.data.data
          : [];
        setTracks(tracksArray);
      }
    } catch (error) {
      console.error("Error fetching tracks:", error);
    } finally {
      setLoading((prev) => ({ ...prev, tracks: false }));
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading((prev) => ({ ...prev, users: true }));

      const response = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/users/discover`,
        headers: session?.user?.access_token
          ? { Authorization: `Bearer ${session.user.access_token}` }
          : undefined,
        method: "GET",
      });

      if (response.data) {
        setUsers(response.data.slice(0, 8)); // Limit to 8 for homepage
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading((prev) => ({ ...prev, users: false }));
    }
  };
  const fetchPlaylists = async () => {
    try {
      setLoading((prev) => ({ ...prev, playlists: true }));

      // First try to get featured playlists for "Curated Playlists" section
      let response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/featured`
      );
      let result = await response.json();

      console.log("Featured playlists API response:", result); // Debug log

      // Handle the response structure from the featured playlists API
      if (
        result.success &&
        result.data &&
        Array.isArray(result.data) &&
        result.data.length > 0
      ) {
        setPlaylists(result.data.slice(0, 6));
      } else {
        // If no featured playlists, fallback to regular public playlists
        console.log(
          "No featured playlists found, falling back to public playlists"
        );
        response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/playlists?visibility=PUBLIC&limit=6`
        );
        result = await response.json();

        console.log("Public playlists API response:", result); // Debug log

        // Handle the double-nested response structure from the public playlists API
        if (
          result.data &&
          result.data.success &&
          result.data.data &&
          Array.isArray(result.data.data)
        ) {
          setPlaylists(result.data.data.slice(0, 6));
        } else if (
          result.success &&
          result.data &&
          Array.isArray(result.data)
        ) {
          // Alternative structure
          setPlaylists(result.data.slice(0, 6));
        } else {
          console.warn("Unexpected playlists API response structure:", result);
          setPlaylists([]); // Set empty array if structure is unexpected
        }
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
      setPlaylists([]); // Set empty array on error
    } finally {
      setLoading((prev) => ({ ...prev, playlists: false }));
    }
  };

  const handlePlayTrack = (track: Track) => {
    const audioUrl = track.audioUrl.startsWith("/api/audio")
      ? track.audioUrl
      : `/api/audio?url=${encodeURIComponent(track.audioUrl)}`;

    playTrack({
      ...track,
      audioUrl,
    });
  };

  const handlePlayToggle = (track: Track) => {
    if (currentTrack?._id === track._id) {
      togglePlayPause();
    } else {
      handlePlayTrack(track);
    }
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/tracks?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-600/90"></div>
        <div className="relative container mx-auto px-6 py-16">
          <div className="text-center text-white space-y-6">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 rounded-full backdrop-blur-sm">
                <Headphones size={48} className="text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  Music
                </span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
                {session?.user?.name ? (
                  <>
                    Hi {session.user.name}! Discover amazing music, connect with
                    artists, and create your perfect soundtrack.
                  </>
                ) : (
                  <>
                    Discover amazing music, connect with artists, and create
                    your perfect soundtrack.
                  </>
                )}
              </p>
            </div>{" "}
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />                <Input
                  type="text"
                  placeholder="Search for music, artists, or playlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-28 py-4 text-lg bg-white/95 backdrop-blur-sm border-0 rounded-xl shadow-lg focus:ring-2 focus:ring-white/50 text-gray-900 placeholder:text-gray-500"
                />{" "}
                <Button
                  type="submit"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 font-medium px-6 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-all duration-200"
                >
                  Search
                </Button>
              </div>
            </form>
            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link href="/discover">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <Users className="mr-2" size={20} />
                  Discover Artists
                </Button>
              </Link>
              <Link href="/tracks">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <Music className="mr-2" size={20} />
                  Browse Tracks
                </Button>
              </Link>
              <Link href="/playlists">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  <Library className="mr-2" size={20} />
                  Explore Playlists
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 space-y-12">
        {/* Trending Tracks Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-lg">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Trending Now
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Popular music that's heating up
                </p>
              </div>
            </div>
            <Link href="/tracks">
              <Button variant="ghost" className="group">
                View All
                <ArrowRight
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                  size={16}
                />
              </Button>
            </Link>
          </div>

          {loading.tracks ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg"
                  >
                    <Skeleton className="w-12 h-12 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
            </div>
          ) : tracks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Music className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No tracks available
                </h3>
                <p className="text-gray-500">Check back later for new music!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tracks.slice(0, 9).map((track) => (
                <FeaturedTrackCard
                  key={track._id}
                  track={track}
                  handlePlayToggle={handlePlayToggle}
                  currentTrack={currentTrack}
                  isPlaying={isPlaying}
                />
              ))}
            </div>
          )}
        </section>

        {/* Featured Artists Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-lg">
                <Users className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Featured Artists
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Talented creators you should follow
                </p>
              </div>
            </div>
            <Link href="/discover">
              <Button variant="ghost" className="group">
                View All
                <ArrowRight
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                  size={16}
                />
              </Button>
            </Link>
          </div>

          {loading.users ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl"
                  >
                    <Skeleton className="w-16 h-16 rounded-full mx-auto mb-3" />
                    <Skeleton className="h-4 w-3/4 mx-auto mb-1" />
                    <Skeleton className="h-3 w-1/2 mx-auto" />
                  </div>
                ))}
            </div>
          ) : users.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No artists available
                </h3>
                <p className="text-gray-500">
                  Check back later to discover new artists!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {users.slice(0, 8).map((user) => (
                <FeaturedArtistCard key={user._id} user={user} />
              ))}
            </div>
          )}
        </section>

        {/* Featured Playlists Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl shadow-lg">
                <Library className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Curated Playlists
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Perfect collections for every mood
                </p>
              </div>
            </div>
            <Link href="/playlists">
              <Button variant="ghost" className="group">
                View All
                <ArrowRight
                  className="ml-2 group-hover:translate-x-1 transition-transform"
                  size={16}
                />
              </Button>
            </Link>
          </div>{" "}
          {loading.playlists ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {Array(12)
                .fill(0)
                .map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-0">
                      <Skeleton className="aspect-square w-full rounded-t-lg" />
                      <div className="p-2">
                        <Skeleton className="h-3 w-3/4 mb-1" />
                        <Skeleton className="h-3 w-1/2 mb-1" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : playlists.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Library className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No playlists available
                </h3>
                <p className="text-gray-500">
                  Check back later for curated playlists!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {" "}
              {playlists.slice(0, 6).map((playlist) => (
                <Link key={playlist._id} href={`/playlist/${playlist._id}`}>
                  <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer overflow-hidden border-0 shadow-sm">
                    <div className="relative">
                      <div className="aspect-square bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center text-white text-lg font-bold relative">
                        {playlist.cover ? (
                          <Image
                            src={playlist.cover}
                            alt={playlist.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 16vw"
                          />
                        ) : (
                          playlist.name?.charAt(0).toUpperCase() || "P"
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                          <Play className="text-white" size={16} />
                        </div>
                      </div>
                      <div className="p-2">
                        <h3 className="font-medium text-xs mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {playlist.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-1 line-clamp-1">
                          {playlist.userId?.name?.split(" ")[0] ||
                            playlist.userId?.username?.substring(0, 8) ||
                            "Unknown"}
                        </p>
                        <div className="flex items-center justify-center text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Music size={10} />
                            {playlist.songs?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Call to Action */}
        <section className="text-center py-12">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                <Sparkles size={32} className="text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Ready to Share Your Music?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Upload your tracks, create playlists, and connect with music
              lovers worldwide.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/upload">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Music className="mr-2" size={20} />
                  Upload Track
                </Button>
              </Link>
              <Link href="/playlists/create">
                <Button variant="outline" size="lg">
                  <Library className="mr-2" size={20} />
                  Create Playlist
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
