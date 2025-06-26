"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  LuMessageSquareMore,
  LuSearch,
  LuPlay,
  LuPause,
  LuHeart,
  LuMessageSquare,
  LuUser,
  LuPencil,
  LuTrash,
  LuMusic,
} from "react-icons/lu";

interface Track {
  _id: string;
  title: string;
  userId?: {
    _id: string;
    name: string;
    username?: string;
  };
  genre?: string;
  genres?: string[]; // Array of genre IDs from backend
  duration?: number;
  plays?: number;
  playCount?: number;
  likes?: number;
  likeCount?: number;
  comments?: number;
  commentCount?: number;
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

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

const TrackRow = ({
  track,
  onViewDetails,
  onEditTrack,
  onDeleteTrack,
  onPlay,
  currentlyPlaying,
  genreMap,
}: {
  track: Track;
  onViewDetails: (trackId: string) => void;
  onEditTrack: (track: Track) => void;
  onDeleteTrack: (trackId: string) => void;
  onPlay: (track: Track) => void;
  currentlyPlaying: string | null;
  genreMap: Record<string, string>;
}) => {
  const isPlaying = currentlyPlaying === track._id;

  // Function to get genre name from genre ID
  const getGenreName = (genreIds: string[] | string | undefined): string => {
    if (!genreIds) return "Unspecified";

    // Handle both array and single genre ID
    const ids = Array.isArray(genreIds) ? genreIds : [genreIds];

    if (ids.length === 0) return "Unspecified";

    // Get the first genre name (tracks typically have one genre)
    const genreName = genreMap[ids[0]];
    return genreName || "Unspecified";
  };

  return (
    <TableRow key={track._id}>
      <TableCell className="w-[60px]">
        {track.coverImage ? (
          <div className="w-10 h-10 rounded bg-muted overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={track.coverImage}
              alt={track.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded bg-muted overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/waveform.png"
              alt={track.title}
              className="w-full h-full object-cover"
            />{" "}
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{track.title}</TableCell>
      <TableCell className="hidden md:table-cell">
        {track.userId?.username || track.userId?.name || "Unknown Artist"}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <Badge variant="outline">
          {getGenreName(track.genres || track.genre)}
        </Badge>
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        {formatDuration(track.duration || 0)}
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center gap-1">
            <LuPlay className="h-3 w-3 text-gray-400" />
            <span>
              {(track.playCount || track.plays || 0).toLocaleString()} plays
            </span>
          </div>
          <div className="flex items-center gap-1">
            <LuHeart className="h-3 w-3 text-gray-400" />
            <span>
              {(track.likeCount || track.likes || 0).toLocaleString()} likes
            </span>
          </div>
          <div className="flex items-center gap-1">
            <LuMessageSquare className="h-3 w-3 text-gray-400" />
            <span>
              {(track.commentCount || track.comments || 0).toLocaleString()}
              comments
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPlay(track)}
        >
          {isPlaying ? (
            <LuPause className="h-4 w-4" />
          ) : (
            <LuPlay className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <LuMessageSquareMore className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onViewDetails(track._id)}>
              View Details{" "}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditTrack(track)}>
              Edit Track
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => onDeleteTrack(track._id)}
            >
              Delete Track
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

const TracksPage = () => {
  const { data: session } = useSession();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState("");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [detailTrack, setDetailTrack] = useState<Track | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [genreMap, setGenreMap] = useState<Record<string, string>>({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTracks, setTotalTracks] = useState(0);
  const tracksPerPage = 10;
  const totalPages = Math.ceil(totalTracks / tracksPerPage);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audioElement = new Audio();
      setAudio(audioElement);

      // Clean up when component unmounts
      return () => {
        if (audioElement) {
          audioElement.pause();
          audioElement.src = "";
        }
      };
    }
  }, []);

  // Fetch genres and create mapping
  const fetchGenres = async () => {
    if (!session?.user?.access_token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/genres`,
        {
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
        }
      );

      if (response.ok) {
        const genresData = await response.json();
        const genres = genresData.data || genresData || [];

        // Create a mapping from genre ID to genre name
        const mapping: Record<string, string> = {};
        genres.forEach((genre: any) => {
          mapping[genre._id] = genre.name;
        });

        setGenreMap(mapping);

        // Set available genre names for filtering
        const genreNames = genres.map((genre: any) => genre.name).sort();
        setAvailableGenres(genreNames);
      }
    } catch (error) {
      console.error("Error fetching genres:", error);
    }
  };

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

      const data = await response.json();
      // Handle different API response structures
      let tracksArray = [];

      if (data && Array.isArray(data.data)) {
        // With our updated backend, tracks should be directly in data.data
        tracksArray = data.data.map((track: any) => ({
          ...track,
          // Map cover to coverImage if coverImage doesn't exist but cover does
          coverImage: track.coverImage || track.cover,
          // Ensure we have consistent property names for metrics
          plays: track.plays || track.playCount || 0,
          likes: track.likes || track.likeCount || 0,
          comments: track.comments || track.commentCount || 0,
        }));
        setTotalTracks(data.totalCount || data.data.length);
      } else if (
        data &&
        data.data &&
        data.data.data &&
        Array.isArray(data.data.data)
      ) {
        // Handle old nested response structure: { statusCode: 200, data: { success: true, data: [...] } }
        tracksArray = data.data.data.map((track: any) => ({
          ...track,
          coverImage: track.coverImage || track.cover,
          // Add metrics consistency here as well
          plays: track.plays || track.playCount || 0,
          likes: track.likes || track.likeCount || 0,
          comments: track.comments || track.commentCount || 0,
        }));
        setTotalTracks(data.data.totalCount || data.data.data.length);
      } else if (data && data.data && data.data.tracks) {
        tracksArray = data.data.tracks.map((track: any) => ({
          ...track,
          coverImage: track.coverImage || track.cover,
          // Add metrics consistency here as well
          plays: track.plays || track.playCount || 0,
          likes: track.likes || track.likeCount || 0,
          comments: track.comments || track.commentCount || 0,
        }));
        setTotalTracks(data.data.totalCount || data.data.tracks.length);
      } else if (data && Array.isArray(data)) {
        tracksArray = data.map((track: any) => ({
          ...track,
          coverImage: track.coverImage || track.cover,
          // Add metrics consistency here as well
          plays: track.plays || track.playCount || 0,
          likes: track.likes || track.likeCount || 0,
          comments: track.comments || track.commentCount || 0,
        }));
        setTotalTracks(data.length);
      } else {
        console.error("Unexpected data structure:", data);
        toast.error("Invalid data format received");
        return;
      }

      setTracks(tracksArray);
    } catch (error) {
      console.error("Error fetching tracks:", error);
      toast.error("Failed to load track data");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchTracks();
    fetchGenres();
  }, [session, currentPage]);

  // Focus restoration effects for modal management
  useEffect(() => {
    if (!isDeleteDialogOpen && !isEditDialogOpen && !isViewDetailsDialogOpen) {
      const timer = setTimeout(() => {
        document
          .querySelectorAll("[data-radix-focus-guard]")
          .forEach((trap) => trap.remove());
        if (document.activeElement !== document.body) {
          document.body.focus();
          document.body.blur();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isDeleteDialogOpen, isEditDialogOpen, isViewDetailsDialogOpen]);

  useEffect(() => {
    const handleGlobalClick = () => {
      if (
        !isDeleteDialogOpen &&
        !isEditDialogOpen &&
        !isViewDetailsDialogOpen
      ) {
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
  }, [isDeleteDialogOpen, isEditDialogOpen, isViewDetailsDialogOpen]);

  // Function to get genre name from genre ID
  const getGenreName = (genreIds: string[] | string | undefined): string => {
    if (!genreIds) return "Unspecified";

    // Handle both array and single genre ID
    const ids = Array.isArray(genreIds) ? genreIds : [genreIds];

    if (ids.length === 0) return "Unspecified";

    // Get the first genre name (tracks typically have one genre)
    const genreName = genreMap[ids[0]];
    return genreName || "Unspecified";
  };

  // Filter tracks based on search query and filters
  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      const matchesSearch =
        !searchQuery ||
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false;

      // Get the mapped genre name for comparison
      const trackGenreName = getGenreName(track.genres || track.genre);
      const matchesGenre =
        genreFilter === "all" || trackGenreName === genreFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "public" && track.visibility !== "PRIVATE") ||
        (statusFilter === "private" && track.visibility === "PRIVATE");

      return matchesSearch && matchesGenre && matchesStatus;
    });
  }, [tracks, searchQuery, genreFilter, statusFilter, genreMap, getGenreName]);

  // Play/pause a track
  const handlePlayTrack = (track: Track) => {
    if (!track.audioUrl) {
      toast.error("No audio URL available for this track");
      return;
    }

    if (audio) {
      if (currentlyPlaying === track._id) {
        // If this track is already playing, pause it
        audio.pause();
        setCurrentlyPlaying(null);
      } else {
        // Otherwise start playing the selected track
        audio.src = track.audioUrl;
        audio.play().catch((error) => {
          console.error("Error playing audio:", error);
          toast.error("Failed to play audio");
        });
        setCurrentlyPlaying(track._id);

        // Set up event listener for when the audio ends
        audio.onended = () => {
          setCurrentlyPlaying(null);
        };
      }
    }
  }; // Handle viewing track details
  const handleViewDetails = async (trackId: string) => {
    const track = tracks.find((t) => t._id === trackId);
    if (track) {
      // Fetch detailed track information from the backend
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/songs/${trackId}`,
          {
            headers: {
              Authorization: `Bearer ${session?.user?.access_token}`,
            },
          }
        );

        if (response.ok) {
          const detailedTrack = await response.json();
          setDetailTrack({ ...track, ...detailedTrack });
        } else {
          // If API fails, use the track data we already have
          setDetailTrack(track);
        }
      } catch (error) {
        console.error("Error fetching track details:", error);
        // If API fails, use the track data we already have
        setDetailTrack(track);
      }

      setIsViewDetailsDialogOpen(true);
    }
  };

  // Handle editing a track
  const handleEditTrack = (track: Track) => {
    setCurrentTrack(track);
    setIsEditDialogOpen(true);
  };

  // Handle submitting edited track
  const handleSubmitEdit = async () => {
    if (!currentTrack || !session?.user?.access_token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/tracks/${currentTrack._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: JSON.stringify({
            title: currentTrack.title,
            genre: currentTrack.genre,
            visibility: currentTrack.visibility,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Track updated successfully");
      setIsEditDialogOpen(false);
      fetchTracks(); // Refresh the tracks list
    } catch (error) {
      console.error("Error updating track:", error);
      toast.error("Failed to update track");
    }
  };

  // Handle deleting a track
  const handleDeleteTrack = (trackId: string) => {
    setCurrentTrackId(trackId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTrack = async () => {
    if (!currentTrackId || !session?.user?.access_token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/tracks/${currentTrackId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Track deleted successfully");
      setTracks(tracks.filter((track) => track._id !== currentTrackId));
    } catch (error) {
      console.error("Error deleting track:", error);
      toast.error("Failed to delete track");
    } finally {
      setIsDeleteDialogOpen(false);
      setCurrentTrackId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tracks</h2>
          <p className="text-muted-foreground">
            Manage music tracks across your platform.
          </p>
        </div>
      </div>

      {/* Search and Filter UI */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1">
          <LuSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tracks by title or artist..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {availableGenres.map((genre) => (
              <SelectItem key={genre} value={genre}>
                {genre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>{" "}
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchTracks}>Refresh</Button>
      </div>

      {/* Tracks Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Artist</TableHead>
                <TableHead className="hidden lg:table-cell">Genre</TableHead>
                <TableHead className="hidden xl:table-cell">Duration</TableHead>
                <TableHead className="hidden lg:table-cell">Metrics</TableHead>
                <TableHead className="w-[50px]">Play</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading state with skeletons
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-10 w-10 rounded" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-[120px]" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-[80px]" />
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Skeleton className="h-4 w-[50px]" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-[40px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : filteredTracks.length > 0 ? (
                filteredTracks.map((track) => (
                  <TrackRow
                    key={track._id}
                    track={track}
                    onViewDetails={handleViewDetails}
                    onEditTrack={handleEditTrack}
                    onDeleteTrack={handleDeleteTrack}
                    onPlay={handlePlayTrack}
                    currentlyPlaying={currentlyPlaying}
                    genreMap={genreMap}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    No tracks found matching the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show only nearby pages when there are many pages
                if (totalPages <= 5) return true;
                return (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                );
              })
              .map((page, index, array) => {
                // Add ellipsis
                if (index > 0 && page > array[index - 1] + 1) {
                  return (
                    <div key={`ellipsis-${page}`} className="flex space-x-1">
                      <span className="flex items-center justify-center px-2">
                        ...
                      </span>
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    </div>
                  );
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete Track Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this track? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onClick={confirmDeleteTrack}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Track Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Track</DialogTitle>
            <DialogDescription>
              Update track information and settings.
            </DialogDescription>
          </DialogHeader>
          {currentTrack && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Title</label>
                <Input
                  className="col-span-3"
                  value={currentTrack.title || ""}
                  onChange={(e) =>
                    setCurrentTrack({ ...currentTrack, title: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Genre</label>
                <Input
                  className="col-span-3"
                  value={currentTrack.genre || ""}
                  onChange={(e) =>
                    setCurrentTrack({ ...currentTrack, genre: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Visibility</label>
                <Select
                  value={currentTrack.visibility || "PUBLIC"}
                  onValueChange={(value) =>
                    setCurrentTrack({ ...currentTrack, visibility: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                    <SelectItem value="PRIVATE">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit}>Save Changes</Button>
          </DialogFooter>{" "}
        </DialogContent>
      </Dialog>

      {/* View Track Details Dialog */}
      <Dialog
        open={isViewDetailsDialogOpen}
        onOpenChange={setIsViewDetailsDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LuMusic className="h-5 w-5" />
              Track Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive information about the selected track.
            </DialogDescription>
          </DialogHeader>
          {detailTrack && (
            <div className="space-y-6 py-4">
              {/* Cover Image and Basic Info */}
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="w-48 h-48 rounded-lg bg-muted overflow-hidden">
                    {detailTrack.coverImage ? (
                      <img
                        src={detailTrack.coverImage}
                        alt={detailTrack.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <LuMusic className="h-16 w-16" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold">{detailTrack.title}</h3>
                    <p className="text-lg text-muted-foreground">
                      by{" "}
                      {detailTrack.userId?.name ||
                        detailTrack.userId?.username ||
                        "Unknown Artist"}
                    </p>{" "}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Genre
                      </label>
                      <p className="text-sm">
                        <Badge variant="outline">
                          {getGenreName(
                            detailTrack.genres || detailTrack.genre
                          )}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Duration
                      </label>
                      <p className="text-sm">
                        {formatDuration(detailTrack.duration || 0)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Visibility
                      </label>
                      <p className="text-sm">
                        <Badge
                          variant={
                            detailTrack.visibility === "PUBLIC"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {detailTrack.visibility || "Private"}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Upload Date
                      </label>
                      <p className="text-sm">
                        {formatDate(detailTrack.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <LuPlay className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-2xl font-bold">
                      {(
                        detailTrack.playCount ||
                        detailTrack.plays ||
                        0
                      ).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Plays</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <LuHeart className="h-6 w-6 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold">
                      {(
                        detailTrack.likeCount ||
                        detailTrack.likes ||
                        0
                      ).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Likes</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <LuMessageSquare className="h-6 w-6 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold">
                      {(
                        detailTrack.commentCount ||
                        detailTrack.comments ||
                        0
                      ).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Comments
                    </div>
                  </CardContent>
                </Card>
              </div>{" "}
              {/* Track Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Track Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Status
                      </label>
                      <p className="text-sm">
                        <Badge
                          variant={
                            detailTrack.status === "FLAGGED"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {detailTrack.status || "Normal"}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  {detailTrack.audioUrl && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Audio URL
                      </label>
                      <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                        {detailTrack.audioUrl}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Artist Information */}
              {detailTrack.userId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Artist Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        {detailTrack.userId?.name ? (
                          <span className="text-lg font-semibold">
                            {detailTrack.userId.name.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <LuUser className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {detailTrack.userId?.name || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          @{detailTrack.userId?.username || "unknown"}
                        </p>
                      </div>{" "}
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Management Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Management Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (detailTrack.audioUrl) {
                          window.open(detailTrack.audioUrl, "_blank");
                        }
                      }}
                      disabled={!detailTrack.audioUrl}
                    >
                      <LuPlay className="h-4 w-4 mr-2" />
                      Play Track
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsViewDetailsDialogOpen(false);
                        handleEditTrack(detailTrack);
                      }}
                    >
                      {" "}
                      <LuPencil className="h-4 w-4 mr-2" />
                      Edit Track
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setIsViewDetailsDialogOpen(false);
                        handleDeleteTrack(detailTrack._id);
                      }}
                    >
                      <LuTrash className="h-4 w-4 mr-2" />
                      Delete Track
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDetailsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TracksPage;
