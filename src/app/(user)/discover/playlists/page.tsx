"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Library, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface PlaylistUser {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

interface Playlist {
  _id: string;
  name: string;
  userId: PlaylistUser;
  songs: string[];
  visibility: string;
  isFeatured: boolean;
  createdAt: string;
}

export default function DiscoverPlaylistsPage() {
  const { data: session } = useSession();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [filteredPlaylists, setFilteredPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/playlists?visibility=PUBLIC`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch playlists");
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setPlaylists(result.data);
          setFilteredPlaylists(result.data);
        } else {
          setError(result.message || "Failed to load playlists");
        }
      } catch (error) {
        console.error("Error fetching playlists:", error);
        setError("An error occurred while loading playlists");
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  // Filter playlists based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPlaylists(playlists);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = playlists.filter(
      (playlist) => 
        playlist.name.toLowerCase().includes(query) || 
        playlist.userId.name.toLowerCase().includes(query) ||
        playlist.userId.username.toLowerCase().includes(query)
    );
    
    setFilteredPlaylists(filtered);
  }, [searchQuery, playlists]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Discover Playlists</h1>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <Skeleton className="h-48 w-full mb-3 rounded-md" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Discover Playlists</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Discover Playlists</h1>
        
        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search playlists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Link href="/playlist/create">
            <Button>
              <Plus size={16} className="mr-1" />
              Create Playlist
            </Button>
          </Link>
        </div>
      </div>

      {filteredPlaylists.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg text-center">
          <Library className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No playlists found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery 
              ? "No playlists match your search criteria." 
              : "There are no public playlists available at the moment."}
          </p>
          <Button onClick={() => setSearchQuery("")} variant="outline">
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPlaylists.map((playlist) => (
            <Link key={playlist._id} href={`/playlist/${playlist._id}`}>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow group cursor-pointer h-full flex flex-col">
                <div className="bg-gradient-to-br from-purple-400 to-indigo-600 aspect-square rounded-md mb-3 flex items-center justify-center text-white text-4xl relative overflow-hidden">
                  {playlist.name?.charAt(0).toUpperCase() || "P"}
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity flex items-center justify-center">
                    <Library className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{playlist.name}</h3>
                <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                  By {playlist.userId?.name || playlist.userId?.username || "Unknown"}
                </p>
                <div className="flex items-center text-sm text-gray-500 mt-auto">
                  <Music size={14} className="mr-1" />
                  <span>{playlist.songs?.length || 0} songs</span>
                  {playlist.isFeatured && (
                    <span className="ml-auto text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}