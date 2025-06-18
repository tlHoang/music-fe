"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { sendRequest } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Music,
  Play,
  Pause,
  Heart,
  Filter,
  Clock,
  User,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlayer } from "@/components/app/player-context";
import LikeButton from "@/components/user/like-button.component";
import { toast } from "sonner";

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

interface Genre {
  _id: string;
  name: string;
  description?: string;
}

const TracksPage = () => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [genresLoading, setGenresLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [visibility, setVisibility] = useState<string>("PUBLIC");
  const [sortBy, setSortBy] = useState<string>("uploadDate");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  // Initialize search query from URL parameters
  useEffect(() => {
    if (searchParams) {
      const urlSearchQuery = searchParams.get("search");
      if (urlSearchQuery) {
        setSearchQuery(urlSearchQuery);
        setDebouncedSearchQuery(urlSearchQuery);
      }
    }
  }, [searchParams]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchGenres();
    fetchTracks();
  }, [session]);

  useEffect(() => {
    setCurrentPage(1);
    fetchTracks(1);
  }, [selectedGenre, visibility, sortBy, sortOrder, debouncedSearchQuery]);

  const fetchGenres = async () => {
    try {
      setGenresLoading(true);
      const response = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/genres`,
        method: "GET",
        headers: session?.user?.access_token
          ? { Authorization: `Bearer ${session.user.access_token}` }
          : {},
      });

      if (response.data && response.data.data) {
        setGenres(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching genres:", error);
      toast.error("Failed to load genres");
    } finally {
      setGenresLoading(false);
    }
  };
  const fetchTracks = async (page: number = 1) => {
    try {
      setLoading(page === 1);

      // Build query parameters
      const params = new URLSearchParams();
      params.append("visibility", visibility);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      params.append("page", page.toString());
      params.append("limit", "20");
      if (debouncedSearchQuery.trim()) {
        params.append("search", debouncedSearchQuery.trim());
      }

      if (selectedGenre && selectedGenre !== "all") {
        params.append("genre", selectedGenre);
      }
      const url = `${process.env.NEXT_PUBLIC_API_URL}/songs/search?${params.toString()}`;
      console.log("Fetching tracks with URL:", url);
      console.log("Search query:", debouncedSearchQuery);
      console.log("Selected genre:", selectedGenre);
      console.log("Sort by:", sortBy, "Order:", sortOrder);

      const response = await sendRequest<any>({
        url,
        method: "GET",
        headers: session?.user?.access_token
          ? { Authorization: `Bearer ${session.user.access_token}` }
          : {},
      });

      console.log("API Response:", response);

      if (response.data && response.data.data) {
        console.log(`Found ${response.data.data.length} tracks`);
        if (page === 1) {
          setTracks(response.data.data);
        } else {
          setTracks((prev) => [...prev, ...response.data.data]);
        }

        // Check if there are more tracks to load
        setHasMore(response.data.data.length === 20);
        setCurrentPage(page);
      } else {
        console.log("No tracks found in response");
        if (page === 1) {
          setTracks([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching tracks:", error);
      toast.error("Failed to load tracks");
    } finally {
      setLoading(false);
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
    setCurrentPage(1);
    fetchTracks(1);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchTracks(currentPage + 1);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Browse Tracks
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover amazing music from talented artists around the world
        </p>
      </div>

      {/* Search and Filters */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <Input
                  type="text"
                  placeholder="Search tracks by title, artist, or genre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">
                <Search size={16} className="mr-2" />
                Search
              </Button>
            </form>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <span className="text-sm font-medium">Filters:</span>
              </div>

              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre._id} value={genre._id}>
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="uploadDate">Upload Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="playCount">Play Count</SelectItem>
                  <SelectItem value="likeCount">Likes</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? (
                  <SortAsc size={16} />
                ) : (
                  <SortDesc size={16} />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracks Grid */}
      {loading && tracks.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(12)
            .fill(0)
            .map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-48 w-full rounded-lg mb-4" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
        </div>
      ) : tracks.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Music className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tracks found</h3>
            <p className="text-gray-500">
              {searchQuery
                ? "Try adjusting your search criteria or browse all tracks"
                : "No tracks are available at the moment"}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedGenre("all");
                  fetchTracks(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tracks.map((track) => (
              <Card
                key={track._id}
                className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              >
                <CardContent className="p-0">
                  <div className="relative aspect-square bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-white overflow-hidden">
                    {track.cover ? (
                      <Image
                        src={track.cover}
                        alt={track.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <Music size={48} className="text-white/70" />
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="lg"
                        className="rounded-full w-16 h-16 bg-white/90 hover:bg-white text-black"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePlayToggle(track);
                        }}
                      >
                        {currentTrack?._id === track._id && isPlaying ? (
                          <Pause size={24} />
                        ) : (
                          <Play size={24} />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="p-4">
                    <Link href={`/track/${track._id}`}>
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                        {track.title}
                      </h3>
                    </Link>

                    <Link href={`/profile/${track.userId._id}`}>
                      <p className="text-sm text-gray-600 mb-3 hover:text-gray-800 transition-colors flex items-center">
                        <User size={14} className="mr-1" />
                        {track.userId.name || track.userId.username}
                      </p>
                    </Link>

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center">
                        <Clock size={14} className="mr-1" />
                        {formatDuration(track.duration)}
                      </span>

                      <div className="flex items-center gap-3">
                        {track.likeCount !== undefined && (
                          <span className="flex items-center">
                            <Heart size={14} className="mr-1" />
                            {track.likeCount}
                          </span>
                        )}
                        {session?.user && (
                          <LikeButton
                            songId={track._id}
                            initialIsLiked={false}
                            showCount={false}
                          />
                        )}
                      </div>
                    </div>

                    {track.genres && track.genres.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {track.genres.slice(0, 2).map((genre, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full"
                          >
                            {genre}
                          </span>
                        ))}
                        {track.genres.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">
                            +{track.genres.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center">
              <Button
                onClick={handleLoadMore}
                disabled={loading}
                variant="outline"
                size="lg"
              >
                {loading ? "Loading..." : "Load More Tracks"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TracksPage;
