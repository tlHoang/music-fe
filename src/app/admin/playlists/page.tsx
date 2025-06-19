"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { LuMessageSquareMore, LuSearch, LuMusic } from "react-icons/lu";

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

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

const PlaylistRow = ({
  playlist,
  onViewDetails,
  onDeletePlaylist,
  onToggleVisibility,
}: {
  playlist: Playlist;
  onViewDetails: (playlistId: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onToggleVisibility: (playlistId: string, isPublic: boolean) => void;
}) => (
  <TableRow key={playlist._id}>
    <TableCell className="w-[60px]">
      {playlist.coverImage ? (
        <div className="w-10 h-10 rounded bg-muted overflow-hidden">
          <img
            src={playlist.coverImage}
            alt={playlist.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
          <LuMusic className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </TableCell>
    <TableCell className="font-medium">{playlist.title}</TableCell>
    <TableCell className="hidden md:table-cell">
      {playlist.userId?.name || "Unknown Creator"}
    </TableCell>
    <TableCell className="hidden lg:table-cell">
      {playlist.trackCount || 0} tracks
    </TableCell>
    <TableCell className="hidden xl:table-cell">
      {playlist.followers || 0}
    </TableCell>
    <TableCell>
      <Badge variant={playlist.isPublic ? "outline" : "secondary"}>
        {playlist.isPublic ? "Public" : "Private"}
      </Badge>
    </TableCell>
    <TableCell>
      <Badge variant={playlist.isFeatured ? "default" : "outline"}>
        {playlist.isFeatured ? "Featured" : "Regular"}
      </Badge>
    </TableCell>
    <TableCell className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <LuMessageSquareMore className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onViewDetails(playlist._id)}>
            View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onToggleVisibility(playlist._id, !playlist.isPublic)}
          >
            {playlist.isPublic ? "Make Private" : "Make Public"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => onDeletePlaylist(playlist._id)}
          >
            Delete Playlist
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  </TableRow>
);

const PlaylistsPage = () => {
  const { data: session } = useSession();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPlaylistId, setCurrentPlaylistId] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPlaylists, setTotalPlaylists] = useState(0);
  const playlistsPerPage = 10;
  const totalPages = Math.ceil(totalPlaylists / playlistsPerPage);
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
      const data = await response.json(); // Handle different API response structures
      let playlistsArray = [];
      if (
        data &&
        data.data &&
        data.data.data &&
        Array.isArray(data.data.data)
      ) {
        // Handle nested data.data.data structure (like your response)
        playlistsArray = data.data.data;
        setTotalPlaylists(data.data.totalCount || data.data.data.length);
      } else if (data && data.data && data.data.playlists) {
        playlistsArray = data.data.playlists;
        setTotalPlaylists(data.data.totalCount || data.data.playlists.length);
      } else if (data && Array.isArray(data.data)) {
        playlistsArray = data.data;
        setTotalPlaylists(data.totalCount || data.data.length);
      } else if (data && Array.isArray(data)) {
        playlistsArray = data;
        setTotalPlaylists(data.length);
      } else {
        console.error("Unexpected data structure:", data);
        toast.error("Invalid data format received");
        return;
      } // Transform the data to match the interface
      const transformedPlaylists = playlistsArray.map((playlist: any) => ({
        ...playlist,
        title: playlist.name || playlist.title, // Map name to title
        trackCount: playlist.songCount || playlist.songs?.length || 0,
        followers: playlist.followersCount || 0, // Map followersCount to followers
        isPublic: playlist.visibility === "PUBLIC",
      }));

      setPlaylists(transformedPlaylists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      toast.error("Failed to load playlist data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [session, currentPage]);

  // Filter playlists based on search query and filters
  const filteredPlaylists = useMemo(() => {
    return playlists.filter((playlist) => {
      const matchesSearch =
        !searchQuery ||
        playlist.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.userId?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        playlist.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        false;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "featured" && playlist.isFeatured === true) ||
        (statusFilter === "public" && playlist.isPublic === true) ||
        (statusFilter === "private" && playlist.isPublic === false);

      return matchesSearch && matchesStatus;
    });
  }, [playlists, searchQuery, statusFilter]);
  // Handle viewing playlist details
  const handleViewDetails = (playlistId: string) => {
    // Redirect to the user playlist view page
    window.location.href = `/playlist/${playlistId}`;
  };
  // Handle toggling playlist visibility
  const handleToggleVisibility = async (
    playlistId: string,
    isPublic: boolean
  ) => {
    if (!session?.user?.access_token) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: JSON.stringify({ visibility: isPublic ? "PUBLIC" : "PRIVATE" }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success(`Playlist is now ${isPublic ? "public" : "private"}`);
      fetchPlaylists(); // Refresh the playlists list
    } catch (error) {
      console.error("Error updating playlist visibility:", error);
      toast.error("Failed to update playlist visibility");
    }
  };
  // Handle deleting a playlist
  const handleDeletePlaylist = (playlistId: string) => {
    setCurrentPlaylistId(playlistId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePlaylist = async () => {
    if (!currentPlaylistId || !session?.user?.access_token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${currentPlaylistId}`,
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

      toast.success("Playlist deleted successfully");
      setPlaylists(
        playlists.filter((playlist) => playlist._id !== currentPlaylistId)
      );
    } catch (error) {
      console.error("Error deleting playlist:", error);
      toast.error("Failed to delete playlist");
    } finally {
      setIsDeleteDialogOpen(false);
      setCurrentPlaylistId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Playlists</h2>
          <p className="text-muted-foreground">
            Manage curated music playlists across your platform.
          </p>
        </div>
      </div>

      {/* Search and Filter UI */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1">
          <LuSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search playlists by title or creator..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchPlaylists}>Refresh</Button>
      </div>

      {/* Playlists Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]"></TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Creator</TableHead>
                <TableHead className="hidden lg:table-cell">Tracks</TableHead>
                <TableHead className="hidden xl:table-cell">
                  Followers
                </TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Status</TableHead>
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
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : filteredPlaylists.length > 0 ? (
                filteredPlaylists.map((playlist) => (                  <PlaylistRow
                    key={playlist._id}
                    playlist={playlist}
                    onViewDetails={handleViewDetails}
                    onDeletePlaylist={handleDeletePlaylist}
                    onToggleVisibility={handleToggleVisibility}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    No playlists found matching the current filters.
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

      {/* Delete Playlist Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this playlist? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onClick={confirmDeletePlaylist}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlaylistsPage;
