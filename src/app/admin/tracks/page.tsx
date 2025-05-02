"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { toast } from "sonner";

interface Track {
  _id: string;
  title: string;
  userId?: {
    _id: string;
    name: string;
  };
  genre?: string;
  duration?: number;
  plays?: number;
  likes?: number;
  comments?: number;
  createdAt: string;
  status?: string;
  visibility?: string; // PUBLIC, PRIVATE
  coverImage?: string;
  audioUrl?: string;
}

const formatDuration = (seconds: number) => {
  if (!seconds) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
};

const TracksPage = () => {
  const { data: session } = useSession();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [genres, setGenres] = useState<string[]>([]);

  // Fetch tracks from the API
  useEffect(() => {
    const fetchTracks = async () => {
      if (!session?.user?.access_token) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/songs/all`,
          {
            headers: {
              Authorization: `Bearer ${session.user.access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("API Response:", responseData); // Debug the API response structure

        // Handle different response structures
        let tracksArray = [];

        if (responseData && Array.isArray(responseData)) {
          tracksArray = responseData;
          console.log("Using direct array response");
        } else if (
          responseData &&
          responseData.data &&
          Array.isArray(responseData.data)
        ) {
          tracksArray = responseData.data;
          console.log("Using responseData.data array");
        } else if (
          responseData &&
          responseData.success &&
          responseData.data &&
          Array.isArray(responseData.data)
        ) {
          tracksArray = responseData.data;
          console.log("Using success.data structure");
        } else {
          console.error("Unexpected data structure:", responseData);
          toast.error("Invalid data format received from server");
          return;
        }

        setTracks(tracksArray);

        // Extract unique genres from tracks
        if (tracksArray.length > 0) {
          const uniqueGenres = Array.from(
            new Set(
              tracksArray
                .map((track: Track) => track.genre)
                .filter(
                  (genre: unknown): genre is string => typeof genre === "string"
                )
            )
          ) as string[];

          setGenres(uniqueGenres);
        }
      } catch (error) {
        console.error("Error fetching tracks:", error);
        toast.error("Failed to load track data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracks();
  }, [session]);

  // Filter tracks based on search and filters
  useEffect(() => {
    if (tracks.length > 0) {
      const filtered = tracks.filter((track) => {
        const matchesSearch =
          track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.userId?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          false;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "flagged"
            ? track.status === "FLAGGED"
            : track.visibility === statusFilter ||
              track.visibility === statusFilter.toUpperCase());
        const matchesGenre =
          genreFilter === "all" || track.genre === genreFilter;
        return matchesSearch && matchesStatus && matchesGenre;
      });
      setFilteredTracks(filtered);
    }
  }, [tracks, searchQuery, statusFilter, genreFilter]);

  const handleTrackAction = async (action: string, trackId: string) => {
    if (!session?.user?.access_token) return;

    try {
      console.log(`${action} track with ID ${trackId}`);

      if (action === "delete") {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/songs/${trackId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.user.access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete track: ${response.status}`);
        }

        setTracks(tracks.filter((track) => track._id !== trackId));
        toast.success("Track deleted successfully");
      } else if (action === "flag" || action === "unflag") {
        const newStatus = action === "flag" ? "FLAGGED" : "NORMAL";
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/songs/${trackId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.user.access_token}`,
            },
            body: JSON.stringify({ status: newStatus }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update track status: ${response.status}`);
        }

        setTracks(
          tracks.map((track) =>
            track._id === trackId ? { ...track, status: newStatus } : track
          )
        );
        toast.success(
          `Track ${action === "flag" ? "flagged" : "unflagged"} successfully`
        );
      }
    } catch (error) {
      console.error(`Error ${action} track:`, error);
      toast.error(`Failed to ${action} track`);
    }
  };

  const getDefaultCoverImage = () => {
    return "/default-profile.jpg"; // Use a music icon or default album art
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Track Management</h1>
        <Button onClick={() => (window.location.href = "/upload")}>
          Upload New Track
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search by title or artist"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="w-full p-2 border rounded-md"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="PUBLIC">Public</option>
          <option value="PRIVATE">Private</option>
          <option value="flagged">Flagged</option>
        </select>
        <select
          className="w-full p-2 border rounded-md"
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
        >
          <option value="all">All Genres</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      {/* Tracks Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Track
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Artist
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Genre
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Duration
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Plays
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Uploaded
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : filteredTracks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    No tracks found
                  </td>
                </tr>
              ) : (
                filteredTracks.map((track) => (
                  <tr key={track._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded"
                            src={track.coverImage || getDefaultCoverImage()}
                            alt={track.title}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {track.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {track.userId ? (
                          <Link
                            href={`/profile/${track.userId._id}`}
                            className="hover:text-blue-600"
                          >
                            {track.userId.name}
                          </Link>
                        ) : (
                          "Unknown Artist"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {track.genre || "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {track.duration
                        ? formatDuration(track.duration)
                        : "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {track.plays?.toLocaleString() || 0}
                      <div className="text-xs text-gray-400">
                        {track.likes?.toLocaleString() || 0} likes
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${
                          track.status === "FLAGGED"
                            ? "bg-red-100 text-red-800"
                            : track.visibility === "PUBLIC"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {track.status === "FLAGGED"
                          ? "Flagged"
                          : track.visibility || "Private"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(track.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <svg
                              className="h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                              />
                            </svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(
                                `/player?trackId=${track._id}`,
                                "_blank"
                              )
                            }
                          >
                            View Track
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => console.log("Edit track", track._id)}
                          >
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {track.status !== "FLAGGED" ? (
                            <DropdownMenuItem
                              onClick={() =>
                                handleTrackAction("flag", track._id)
                              }
                              className="text-amber-600"
                            >
                              Flag Content
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                handleTrackAction("unflag", track._id)
                              }
                              className="text-green-600"
                            >
                              Unflag Content
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              handleTrackAction("delete", track._id)
                            }
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{filteredTracks.length}</span>{" "}
            tracks
          </div>
          <div className="flex-1 flex justify-end">
            <Button disabled className="mr-3">
              Previous
            </Button>
            <Button>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TracksPage;
