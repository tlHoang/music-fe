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

interface Playlist {
  _id: string;
  title: string;
  userId?: {
    _id: string;
    name: string;
  };
  trackCount?: number;
  followers?: number;
  likes?: number;
  isPublic?: boolean;
  createdAt: string;
  status?: string;
  coverImage?: string;
  isFeatured?: boolean;
  description?: string;
}

const PlaylistsPage = () => {
  const { data: session } = useSession();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [filteredPlaylists, setFilteredPlaylists] = useState<Playlist[]>([]);

  // Fetch playlists from the API
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!session?.user?.access_token) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/playlists/all`,
          {
            headers: {
              Authorization: `Bearer ${session.user.access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.data) {
          setPlaylists(data.data);
        }
      } catch (error) {
        console.error("Error fetching playlists:", error);
        toast.error("Failed to load playlist data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlaylists();
  }, [session]);

  // Filter playlists based on search and filters
  useEffect(() => {
    if (playlists.length > 0) {
      const filtered = playlists.filter((playlist) => {
        const matchesSearch =
          playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          playlist.userId?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          false;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "featured"
            ? playlist.isFeatured === true
            : statusFilter === "public"
              ? playlist.isPublic === true
              : statusFilter === "private"
                ? playlist.isPublic === false
                : true);
        return matchesSearch && matchesStatus;
      });
      setFilteredPlaylists(filtered);
    }
  }, [playlists, searchQuery, statusFilter]);

  const handlePlaylistAction = async (action: string, playlistId: string) => {
    if (!session?.user?.access_token) return;

    try {
      console.log(`${action} playlist with ID ${playlistId}`);

      if (action === "delete") {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.user.access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete playlist: ${response.status}`);
        }

        setPlaylists(
          playlists.filter((playlist) => playlist._id !== playlistId)
        );
        toast.success("Playlist deleted successfully");
      } else if (action === "feature" || action === "unfeature") {
        const isFeatured = action === "feature";
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}/feature`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.user.access_token}`,
            },
            body: JSON.stringify({ isFeatured }),
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to update playlist featured status: ${response.status}`
          );
        }

        setPlaylists(
          playlists.map((playlist) =>
            playlist._id === playlistId ? { ...playlist, isFeatured } : playlist
          )
        );
        toast.success(
          `Playlist ${isFeatured ? "featured" : "unfeatured"} successfully`
        );
      }
    } catch (error) {
      console.error(`Error ${action} playlist:`, error);
      toast.error(`Failed to ${action} playlist`);
    }
  };

  const getDefaultCoverImage = () => {
    return "/default-profile.jpg"; // Use a playlist default image
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Playlist Management
        </h1>
        <Button onClick={() => console.log("Create new playlist")}>
          Create New Playlist
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Search by title or creator"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="w-full p-2 border rounded-md"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Playlists</option>
          <option value="featured">Featured</option>
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>

      {/* Playlists Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Playlist
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Creator
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tracks
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Followers
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
                  Created
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
                  <td colSpan={7} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : filteredPlaylists.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    No playlists found
                  </td>
                </tr>
              ) : (
                filteredPlaylists.map((playlist) => (
                  <tr key={playlist._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img
                            className="h-10 w-10 rounded"
                            src={playlist.coverImage || getDefaultCoverImage()}
                            alt={playlist.title}
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {playlist.title}
                          </div>
                          {playlist.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">
                              {playlist.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {playlist.userId ? (
                          <Link
                            href={`/profile/${playlist.userId._id}`}
                            className="hover:text-blue-600"
                          >
                            {playlist.userId.name}
                          </Link>
                        ) : (
                          "Unknown Creator"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {playlist.trackCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {playlist.followers?.toLocaleString() || 0}
                      <div className="text-xs text-gray-400">
                        {playlist.likes?.toLocaleString() || 0} likes
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {playlist.isFeatured && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            Featured
                          </span>
                        )}
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${playlist.isPublic ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                        >
                          {playlist.isPublic ? "Public" : "Private"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(playlist.createdAt).toLocaleDateString()}
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
                              window.open(`/playlist/${playlist._id}`, "_blank")
                            }
                          >
                            View Playlist
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              console.log("Edit playlist", playlist._id)
                            }
                          >
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!playlist.isFeatured ? (
                            <DropdownMenuItem
                              onClick={() =>
                                handlePlaylistAction("feature", playlist._id)
                              }
                              className="text-purple-600"
                            >
                              Feature Playlist
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                handlePlaylistAction("unfeature", playlist._id)
                              }
                              className="text-green-600"
                            >
                              Unfeature Playlist
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              handlePlaylistAction("delete", playlist._id)
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
            Showing{" "}
            <span className="font-medium">{filteredPlaylists.length}</span>{" "}
            playlists
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

export default PlaylistsPage;
