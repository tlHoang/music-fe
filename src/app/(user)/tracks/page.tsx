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
import AddToPlaylistButton from "@/components/user/playlist/add-to-playlist-button";
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
  genres?: Array<{ _id: string; name: string } | string>; // Support both populated and unpopulated genres
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
  const [genresLoading, setGenresLoading] = useState(false);  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"title" | "lyrics">("title");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [visibility, setVisibility] = useState<string>("PUBLIC");
  const [sortBy, setSortBy] = useState<string>("uploadDate");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();

  // Debug log to see genres state
  console.log(
    "TracksPage - Current genres state:",
    genres,
    "length:",
    genres.length
  );

  // Initialize search query from URL parameters
  useEffect(() => {
    if (searchParams) {
      const urlSearchQuery = searchParams.get("search");
      if (urlSearchQuery) {
        setSearchQuery(urlSearchQuery);
        setDebouncedSearchQuery(urlSearchQuery);
      }
    }
    setInitialized(true);
  }, [searchParams]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);
  useEffect(() => {
    if (initialized) {
      fetchGenres();
    }
  }, [session, initialized]);

  useEffect(() => {
    if (session && initialized) {
      // Only fetch tracks when session is available and component is initialized
      setCurrentPage(1);
      fetchTracks(1);
    }  }, [
    selectedGenre,
    visibility,
    sortBy,
    sortOrder,
    debouncedSearchQuery,
    searchType,
    session,
    initialized,
  ]);
  const fetchGenres = async () => {
    try {
      setGenresLoading(true);
      console.log("[fetchGenres] called");
      const response = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/genres`,
        method: "GET",
        headers: session?.user?.access_token
          ? { Authorization: `Bearer ${session.user.access_token}` }
          : {},
      });
      console.log("[fetchGenres] response:", response);
      if (response.data && Array.isArray(response.data)) {
        setGenres(response.data);
        console.log("[fetchGenres] setGenres:", response.data);
      } else {
        console.log("[fetchGenres] No genres data found in response");
      }
    } catch (error) {
      console.error("[fetchGenres] Error fetching genres:", error);
      toast.error("Failed to load genres");
    } finally {
      setGenresLoading(false);
    }
  };
  // Function to search by lyrics using vector search
  const fetchTracksByLyrics = async (page: number = 1) => {
    try {
      setLoading(page === 1);

      if (!debouncedSearchQuery || !debouncedSearchQuery.trim()) {
        // If no search query for lyrics, return empty results
        setTracks([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.append("q", debouncedSearchQuery.trim());
      params.append("limit", "20");
      params.append("threshold", "0.7");

      const url = `${process.env.NEXT_PUBLIC_API_URL}/songs/search/lyrics?${params.toString()}`;
      console.log("Fetching tracks by lyrics with URL:", url);

      const response = await sendRequest<any>({
        url,
        method: "GET",
        headers: session?.user?.access_token
          ? { Authorization: `Bearer ${session.user.access_token}` }
          : {},
      });      console.log("Lyrics Search API Response:", response);
      
      if (response.data && response.data.data) {
        const fetchedTracks = response.data.data;
        console.log("Raw fetched tracks:", fetchedTracks.length);
        console.log("Actual fetched tracks:", fetchedTracks);
        
        // For lyrics search, we don't apply genre filtering since it's based on semantic similarity
        // The most relevant results should be shown regardless of genre
        console.log("Lyrics search: skipping genre filter to preserve semantic relevance");

        console.log(`Found ${fetchedTracks.length} tracks by lyrics search`);
        if (page === 1) {
          setTracks(fetchedTracks);
        } else {
          setTracks((prev) => [...prev, ...fetchedTracks]);
        }

        // For lyrics search, we typically get all results at once
        setHasMore(false);
        setCurrentPage(page);
      } else {
        console.log("No tracks found in lyrics search response");
        if (page === 1) {
          setTracks([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching tracks by lyrics:", error);
      toast.error("Failed to search tracks by lyrics");
    } finally {
      setLoading(false);
    }
  };
  const fetchTracks = async (page: number = 1) => {
    // Use lyrics search if searchType is 'lyrics' and there's a query
    if (searchType === "lyrics") {
      return fetchTracksByLyrics(page);
    }

    // Default title/text search
    try {
      setLoading(page === 1);

      // Build query parameters
      const params = new URLSearchParams();
      params.append("visibility", visibility);
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      params.append("page", page.toString());
      params.append("limit", "20");

      // Only add search parameter if there's a search query
      if (debouncedSearchQuery && debouncedSearchQuery.trim()) {
        params.append("search", debouncedSearchQuery.trim());
      }

      if (selectedGenre && selectedGenre !== "all") {
        const cleanGenre = selectedGenre.replace(/\?+$/, "");
        console.log("Appending genre to params:", cleanGenre);
        params.append("genre", cleanGenre);
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
        let fetchedTracks = response.data.data;
        // Client-side filter fallback: ensure only tracks with selectedGenre
        if (selectedGenre && selectedGenre !== "all") {
          fetchedTracks = (fetchedTracks as Track[]).filter((track: Track) =>
            track.genres?.some((g: { _id?: string } | string) =>
              typeof g === "string"
                ? g === selectedGenre
                : g._id === selectedGenre
            )
          );
        }
        console.log(
          `Found ${fetchedTracks.length} tracks after client-side filter`
        );
        if (page === 1) {
          setTracks(fetchedTracks);
        } else {
          setTracks((prev) => [...prev, ...fetchedTracks]);
        }

        // Check if there are more tracks to load
        setHasMore(fetchedTracks.length === 20);
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
      artist: track.userId.username,
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
  }; // Helper function to get genre name by ID or populated object
  const getGenreName = (
    genre: string | { _id: string; name: string }
  ): string => {
    if (typeof genre === "string") {
      // If it's a string (ID), find the name from the genres array
      const foundGenre = genres.find((g) => g._id === genre);
      return foundGenre ? foundGenre.name : genre; // fallback to ID if name not found
    } else if (genre && typeof genre === "object" && genre.name) {
      // If it's already populated, return the name directly
      return genre.name;
    } else {
      console.warn("Invalid genre data:", genre);
      return "Unknown Genre";
    }
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
          <div className="space-y-4">            {/* Search Bar */}
            <form onSubmit={handleSearch} className="space-y-3">              {/* Modern Search Type Toggle */}
              <div className="flex items-center justify-start">
                <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSearchType("title")}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      searchType === "title"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    <Music size={16} />
                    <span>Title & Artist</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchType("lyrics")}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                      searchType === "lyrics"
                        ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    }`}
                  >
                    <Search size={16} />
                    <span>Lyrics</span>
                  </button>
                </div>
              </div>
              
              {/* Search Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <Input
                    type="text"
                    placeholder={
                      searchType === "lyrics"
                        ? "Search by lyrics content (e.g., 'love under stars', 'broken heart')..."
                        : "Search tracks by title, artist, or genre..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">
                  <Search size={16} className="mr-2" />
                  Search
                </Button>              </div>
            </form>            {/* Search Type Information */}
            {searchType === "lyrics" && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">                <div className="flex items-start gap-2">
                  <Search size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Lyrics Search:</strong> Search for themes, emotions, or specific phrases within song lyrics.
                    <br />
                    <em>Note: Genre filters are disabled for lyrics search to preserve semantic relevance.</em>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter size={16} />
                <span className="text-sm font-medium">Filters:</span>
              </div>{" "}              <Select 
                value={selectedGenre} 
                onValueChange={setSelectedGenre}
                disabled={searchType === "lyrics"}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map((genre) => {
                    console.log("Rendering genre option:", genre);
                    return (
                      <SelectItem key={genre._id} value={genre._id}>
                        {genre.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>              </Select>
              <Select 
                value={sortBy} 
                onValueChange={setSortBy}
                disabled={searchType === "lyrics"}
              >
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
                disabled={searchType === "lyrics"}
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
              {searchType === "lyrics" && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  Results sorted by relevance
                </span>
              )}
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
            <h3 className="text-xl font-semibold mb-2">No tracks found</h3>            <p className="text-gray-500">
              {searchQuery
                ? searchType === "lyrics"
                  ? "No tracks found with matching lyrics. Try using different keywords or switch to title search."
                  : "Try adjusting your search criteria or browse all tracks"
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
                      </span>                      <div className="flex items-center gap-3">
                        {track.likeCount !== undefined && (
                          <span className="flex items-center">
                            <Heart size={14} className="mr-1" />
                            {track.likeCount}
                          </span>
                        )}
                        {session?.user && (
                          <>
                            <LikeButton
                              songId={track._id}
                              initialIsLiked={false}
                              showCount={false}
                            />
                            <AddToPlaylistButton
                              trackId={track._id}
                              size="sm"
                            />
                          </>
                        )}
                      </div>
                    </div>{" "}
                    {track.genres && track.genres.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {track.genres.slice(0, 2).map((genre, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-full"
                          >
                            {getGenreName(genre)}
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
