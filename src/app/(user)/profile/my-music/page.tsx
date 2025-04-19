"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { sendRequest } from "@/utils/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ISong {
  _id: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  audioUrl: string;
  userId: string;
  duration: number;
  uploadDate: string;
  plays?: number;
  likes?: number;
}

const MyMusicPage = () => {
  const { data: session } = useSession();
  const [songs, setSongs] = useState<ISong[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentSong, setCurrentSong] = useState<ISong | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editVisibility, setEditVisibility] = useState<"PUBLIC" | "PRIVATE">(
    "PUBLIC"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUserSongs();
  }, [session]);

  const fetchUserSongs = async () => {
    try {
      setLoading(true);
      const userId = session?.user?._id;
      if (!userId) return;

      const response = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/songs/user-songs`,
        headers: {
          Authorization: `Bearer ${session?.user?.access_token}`,
        },
        method: "GET",
      });

      if (response.data) {
        setSongs(response.data);
      }
    } catch (error) {
      console.error("Error fetching songs:", error);
      setMessage("Failed to load your tracks. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSong = (song: ISong) => {
    setCurrentSong(song);
    setEditTitle(song.title);
    setEditVisibility(song.visibility);
    setIsEditDialogOpen(true);
  };

  const handleDeleteSong = (song: ISong) => {
    setCurrentSong(song);
    setIsDeleteDialogOpen(true);
  };

  const saveEditedSong = async () => {
    if (!currentSong || !editTitle) return;

    try {
      setMessage("Updating...");
      const response = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/songs/${currentSong._id}`,
        headers: {
          Authorization: `Bearer ${session?.user?.access_token}`,
          "Content-Type": "application/json",
        },
        method: "PATCH",
        body: {
          title: editTitle,
          visibility: editVisibility,
        },
      });

      if (response.data) {
        // Update local state
        setSongs(
          songs.map((song) =>
            song._id === currentSong._id
              ? { ...song, title: editTitle, visibility: editVisibility }
              : song
          )
        );
        setMessage("Track updated successfully!");
        setIsEditDialogOpen(false);
      }
    } catch (error) {
      console.error("Error updating song:", error);
      setMessage("Failed to update track. Please try again.");
    }
  };

  const deleteSong = async () => {
    if (!currentSong) return;

    try {
      setMessage("Deleting...");
      const response = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/songs/${currentSong._id}`,
        headers: {
          Authorization: `Bearer ${session?.user?.access_token}`,
        },
        method: "DELETE",
      });

      if (response.success) {
        // Remove song from local state
        setSongs(songs.filter((song) => song._id !== currentSong._id));
        setMessage("Track deleted successfully!");
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error("Error deleting song:", error);
      setMessage("Failed to delete track. Please try again.");
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <p className="text-xl">Loading your tracks...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Tracks</h1>
        <div className="flex gap-4">
          <Link href="/upload">
            <Button>Upload New Track</Button>
          </Link>
        </div>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      {songs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            You haven't uploaded any tracks yet
          </h2>
          <p className="text-gray-500 mb-6">
            Start sharing your music with the world!
          </p>
          <Link href="/upload">
            <Button>Upload Your First Track</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Visibility
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plays
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {songs.map((song) => (
                <tr key={song._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-md mr-4"></div>
                      <div className="text-sm font-medium text-gray-900">
                        {song.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDuration(song.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(song.uploadDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-xs",
                        song.visibility === "PUBLIC"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {song.visibility}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {song.plays || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleEditSong(song)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteSong(song)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Track</DialogTitle>
            <DialogDescription>
              Make changes to your track details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Track title"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="visibility" className="text-sm font-medium">
                Visibility
              </label>
              <select
                id="visibility"
                value={editVisibility}
                onChange={(e) =>
                  setEditVisibility(e.target.value as "PUBLIC" | "PRIVATE")
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveEditedSong}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Track</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{currentSong?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteSong}>
              Delete Track
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyMusicPage;
