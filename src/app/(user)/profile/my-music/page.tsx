"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { sendRequest } from "@/utils/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useFocusRestore } from "@/hooks/useFocusRestore";
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
import { FileText } from "lucide-react";

interface ISong {
  _id: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  audioUrl: string;
  userId: string;
  duration: number;
  uploadDate: string;
  playCount?: number;
  likeCount?: number;
  cover?: string; // Add cover field for signed cover URL
  lyrics?: string; // Add lyrics field
}

const MyMusicPage = () => {
  const { data: session } = useSession();

  const [songs, setSongs] = useState<ISong[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLyricsDialogOpen, setIsLyricsDialogOpen] = useState(false);
  const [currentSong, setCurrentSong] = useState<ISong | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editVisibility, setEditVisibility] = useState<"PUBLIC" | "PRIVATE">(
    "PUBLIC"
  );
  const [message, setMessage] = useState("");

  // Use the custom focus restore hook
  const { pageRef, storeFocusedElement, createCloseHandler } = useFocusRestore([
    isEditDialogOpen,
    isDeleteDialogOpen,
    isLyricsDialogOpen,
  ]);

  const fetchUserSongs = useCallback(async () => {
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
        console.log("Fetched songs:", response.data);
        setSongs(response.data);
      }
    } catch (error) {
      console.error("Error fetching songs:", error);
      setMessage("Failed to load your tracks. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [session]);
  useEffect(() => {
    fetchUserSongs();
  }, [fetchUserSongs]);
  // Ensure proper focus restoration when all modals are closed
  useEffect(() => {
    if (!isEditDialogOpen && !isDeleteDialogOpen && !isLyricsDialogOpen) {
      // Small delay to ensure DOM has updated
      const timer = setTimeout(() => {
        // Remove any residual focus traps
        const focusTraps = document.querySelectorAll(
          "[data-radix-focus-guard]"
        );
        focusTraps.forEach((trap) => trap.remove());

        // Restore focus to body
        if (document.activeElement !== document.body) {
          document.body.focus();
          document.body.blur();
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isEditDialogOpen, isDeleteDialogOpen, isLyricsDialogOpen]);

  // Emergency fix: Add a global click handler to restore interactivity
  useEffect(() => {
    const handleGlobalClick = () => {
      // If no modals are open and the page seems non-interactive, force cleanup
      if (!isEditDialogOpen && !isDeleteDialogOpen && !isLyricsDialogOpen) {
        document
          .querySelectorAll("[data-radix-focus-guard], [data-radix-portal]")
          .forEach((el) => {
            el.remove();
          });
        document.body.style.pointerEvents = "";
        document.body.style.overflow = "";
        document.querySelectorAll("[inert]").forEach((el) => {
          el.removeAttribute("inert");
        });
      }
    };

    document.addEventListener("click", handleGlobalClick, true);
    return () => document.removeEventListener("click", handleGlobalClick, true);
  }, [isEditDialogOpen, isDeleteDialogOpen, isLyricsDialogOpen]);
  const handleEditSong = (song: ISong) => {
    storeFocusedElement();
    setCurrentSong(song);
    setEditTitle(song.title);
    setEditVisibility(song.visibility);
    setIsEditDialogOpen(true);
  };

  const handleDeleteSong = (song: ISong) => {
    storeFocusedElement();
    setCurrentSong(song);
    setIsDeleteDialogOpen(true);
  };

  const handleViewLyrics = (song: ISong) => {
    storeFocusedElement();
    setCurrentSong(song);
    setIsLyricsDialogOpen(true);
  }; // Create close handlers using the hook
  const handleCloseLyricsDialog = createCloseHandler(() => {
    setIsLyricsDialogOpen(false);
    setCurrentSong(null);
  });

  const handleCloseEditDialog = createCloseHandler(() => {
    setIsEditDialogOpen(false);
    setCurrentSong(null);
    setEditTitle("");
    setEditVisibility("PUBLIC");
  });

  const handleCloseDeleteDialog = createCloseHandler(() => {
    setIsDeleteDialogOpen(false);
    setCurrentSong(null);
  });

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
        handleCloseEditDialog();
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
      const response = (
        await sendRequest<any>({
          url: `${process.env.NEXT_PUBLIC_API_URL}/songs/${currentSong._id}`,
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
          method: "DELETE",
        })
      ).data;

      console.log(response);

      // First check if we have a success property in the response
      if (response.success) {
        // Remove song from local state
        setSongs(songs.filter((song) => song._id !== currentSong._id));
        setMessage(`Track "${currentSong.title}" deleted successfully!`);
        handleCloseDeleteDialog();

        // Provide feedback about the Firebase file deletion status
        if (response.fileDeleted === false) {
          console.warn(
            "Note: The audio file could not be removed from storage, but the track was deleted from the database."
          );
        }
      } else {
        throw new Error(response.message || "Failed to delete track");
      }
    } catch (error) {
      console.error("Error deleting song:", error);
      setMessage(
        `Failed to delete track: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      // Keep the dialog open so the user can try again
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
        {/* <p className="text-xl">Loading your tracks...</p> */}
        <p></p>
      </div>
    );
  }
  return (
    <div ref={pageRef} className="container mx-auto p-6" tabIndex={-1}>
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
      )}{" "}
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
                  Lyrics
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
                      {song.cover ? (
                        <Image
                          src={song.cover}
                          alt={song.title}
                          width={40}
                          height={40}
                          className="flex-shrink-0 rounded-md mr-4 object-cover bg-gray-200"
                        />
                      ) : (
                        <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-md mr-4"></div>
                      )}
                      <div className="text-sm font-medium text-gray-900">
                        {song.title}{" "}
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
                    {song.lyrics ? (
                      <button
                        onClick={() => handleViewLyrics(song)}
                        className="hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    ) : (
                      <span>None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {song.playCount || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {song.lyrics && (
                          <DropdownMenuItem
                            onClick={() => handleViewLyrics(song)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Lyrics
                          </DropdownMenuItem>
                        )}
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
      )}{" "}
      {/* Edit Dialog */}
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseEditDialog();
        }}
      >
        <DialogTrigger asChild />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Track</DialogTitle>
            <DialogDescription>Update track details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full"
              />
            </div>
          </div>{" "}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditDialog}>
              Cancel
            </Button>
            <Button onClick={saveEditedSong}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>{" "}
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseDeleteDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Track</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{currentSong?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>{" "}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDeleteDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteSong}>
              Delete Track
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>{" "}
      {/* Lyrics Dialog */}
      <Dialog
        open={isLyricsDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseLyricsDialog();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Lyrics - {currentSong?.title}</DialogTitle>
            <DialogDescription>Song lyrics for your track</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-96 p-4 bg-gray-50 rounded-lg">
            {currentSong?.lyrics ? (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-mono">
                {currentSong.lyrics}
              </pre>
            ) : (
              <p className="text-gray-500 italic">
                No lyrics available for this track.
              </p>
            )}
          </div>{" "}
          <DialogFooter>
            <Button onClick={handleCloseLyricsDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyMusicPage;
