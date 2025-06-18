// filepath: d:\datn\fe\src\app\admin\users\page.tsx
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LuMessageSquareMore,
  LuSearch,
  LuUser,
  LuMail,
  LuCalendar,
  LuShield,
  LuUsers,
  LuMusic,
  LuHeart,
  LuClock,
} from "react-icons/lu";

interface User {
  _id: string;
  name?: string;
  username?: string;
  email: string;
  role: "ADMIN" | "USER" | string;
  status?: string;
  profilePicture?: string;
  createdAt?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  trackCount?: number;
  playlistCount?: number;
  lastActive?: string;
  isVerified?: boolean;
  isActive?: boolean;
}

const UserRow = ({
  user,
  onViewDetails,
  onDeleteUser,
  onUpdateRole,
  onBanUser,
}: {
  user: User;
  onViewDetails: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateRole: (userId: string, newRole: string) => void;
  onBanUser: (userId: string, isBanned: boolean) => void;
}) => {
  // Use the status field from backend, fallback to isActive for compatibility
  const userStatus = user.status
    ? user.status === "ACTIVE"
      ? "Active"
      : user.status === "SUSPENDED"
        ? "Banned"
        : user.status
    : user.isActive !== false
      ? "Active"
      : "Banned";

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };
  return (
    <TableRow key={user._id}>
      <TableCell className="w-[80px]">
        <Avatar>
          <AvatarImage src={user.profilePicture} />
          <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
        </Avatar>
      </TableCell>
      <TableCell className="font-medium">{user.username || "N/A"}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge
          variant={user.role === "ADMIN" ? "destructive" : "default"}
          className="rounded-sm"
        >
          {user.role || "USER"}
        </Badge>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        <Badge
          variant={userStatus === "Active" ? "outline" : "secondary"}
          className="rounded-sm"
        >
          {userStatus}
        </Badge>
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        {formatDate(user.createdAt)}
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
            <DropdownMenuItem onClick={() => onViewDetails(user._id)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full text-left cursor-default px-2 py-1.5 text-sm">
                Change Role
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => onUpdateRole(user._id, "USER")}
                >
                  User
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onUpdateRole(user._id, "ADMIN")}
                >
                  Admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenuSeparator />
            {user.status === "SUSPENDED" ||
            (user.status !== "ACTIVE" && user.isActive === false) ? (
              <DropdownMenuItem onClick={() => onBanUser(user._id, false)}>
                Unban User
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onBanUser(user._id, true)}
              >
                Ban User
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDeleteUser(user._id)}
            >
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

const UsersPage = () => {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;
  const totalPages = Math.ceil(totalUsers / usersPerPage);

  const fetchUsers = async () => {
    if (!session?.user?.access_token) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/all`,
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
      if (
        data &&
        data.data &&
        data.data.success &&
        Array.isArray(data.data.data)
      ) {
        setUsers(data.data.data);
        setTotalUsers(data.data.data.length);
      } else if (data && data.data && Array.isArray(data.data)) {
        setUsers(data.data);
        setTotalUsers(data.data.length);
      } else if (data && Array.isArray(data)) {
        setUsers(data);
        setTotalUsers(data.length);
      } else {
        console.error("Unexpected data structure:", data);
        toast.error("Invalid data format received");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [session, currentPage]);

  // Filter users based on search query and filters
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !searchQuery ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false;

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          (user.status === "ACTIVE" ||
            (user.status !== "SUSPENDED" && user.isActive !== false))) ||
        (statusFilter === "banned" &&
          (user.status === "SUSPENDED" ||
            (user.status !== "ACTIVE" && user.isActive === false)));

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Handle viewing user details
  const handleViewDetails = (userId: string) => {
    const user = users.find((u) => u._id === userId);
    if (user) {
      setCurrentUser(user);
      setIsViewDetailsDialogOpen(true);
    }
  };

  // Handle changing a user's role
  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!session?.user?.access_token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success(`User role updated to ${newRole}`);
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    }
  };

  // Handle banning/unbanning a user
  const handleBanUser = async (userId: string, isBanned: boolean) => {
    if (!session?.user?.access_token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: JSON.stringify({ status: isBanned ? "SUSPENDED" : "ACTIVE" }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success(
        isBanned ? "User banned successfully" : "User unbanned successfully"
      );
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error(`Failed to ${isBanned ? "ban" : "unban"} user`);
    }
  };

  // Handle deleting a user
  const handleDeleteUser = (userId: string) => {
    setCurrentUserId(userId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!currentUserId || !session?.user?.access_token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${currentUserId}`,
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

      toast.success("User deleted successfully");
      setUsers(users.filter((user) => user._id !== currentUserId));
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsDeleteDialogOpen(false);
      setCurrentUserId("");
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatLastActive = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage user accounts and permissions.
          </p>
        </div>
      </div>

      {/* Search and Filter UI */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <div className="relative flex-1">
          <LuSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="banned">Banned</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={fetchUsers}>Refresh</Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]"></TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="hidden md:table-cell">Role</TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
                <TableHead className="hidden xl:table-cell">Joined</TableHead>
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
                        <Skeleton className="h-10 w-10 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[150px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[200px]" />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Skeleton className="h-4 w-[80px]" />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Skeleton className="h-4 w-[80px]" />
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <UserRow
                    key={user._id}
                    user={user}
                    onViewDetails={handleViewDetails}
                    onDeleteUser={handleDeleteUser}
                    onUpdateRole={handleUpdateRole}
                    onBanUser={handleBanUser}
                  />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    No users found matching the current filters.
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

      {/* Delete User Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onClick={confirmDeleteUser}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View User Details Dialog */}
      <Dialog
        open={isViewDetailsDialogOpen}
        onOpenChange={setIsViewDetailsDialogOpen}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LuUser className="h-5 w-5" />
              User Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive information about the selected user.
            </DialogDescription>
          </DialogHeader>
          {currentUser && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={currentUser.profilePicture} />
                  <AvatarFallback className="text-lg">
                    {currentUser.username?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">
                    {currentUser.username || "N/A"}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        currentUser.role === "ADMIN" ? "destructive" : "default"
                      }
                      className="rounded-sm"
                    >
                      {currentUser.role || "USER"}
                    </Badge>
                    <Badge
                      variant={
                        currentUser.status === "ACTIVE" ||
                        (currentUser.status !== "SUSPENDED" &&
                          currentUser.isActive !== false)
                          ? "outline"
                          : "secondary"
                      }
                      className="rounded-sm"
                    >
                      {currentUser.status === "ACTIVE" ||
                      (currentUser.status !== "SUSPENDED" &&
                        currentUser.isActive !== false)
                        ? "Active"
                        : "Banned"}
                    </Badge>
                    {currentUser.isVerified && (
                      <Badge variant="secondary" className="rounded-sm">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LuMail className="h-4 w-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Email
                      </label>
                      <p className="text-sm">{currentUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Username
                      </label>
                      <p className="text-sm">{currentUser.username || "N/A"}</p>
                    </div>
                  </div>
                  {currentUser.bio && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Bio
                      </label>
                      <p className="text-sm mt-1">{currentUser.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LuUsers className="h-4 w-4" />
                    Activity Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <LuMusic className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold">
                        {currentUser.trackCount || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tracks
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <LuUsers className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold">
                        {currentUser.followerCount || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Followers
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <LuHeart className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="text-2xl font-bold">
                        {currentUser.followingCount || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Following
                      </div>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-center mb-2">
                        <LuMusic className="h-4 w-4 text-purple-500" />
                      </div>
                      <div className="text-2xl font-bold">
                        {currentUser.playlistCount || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Playlists
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LuCalendar className="h-4 w-4" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Member Since
                      </label>
                      <p className="text-sm">
                        {formatDate(currentUser.createdAt)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <LuClock className="h-3 w-3" />
                        Last Active
                      </label>
                      <p className="text-sm">
                        {formatLastActive(currentUser.lastActive)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Account Status
                      </label>
                      <p className="text-sm">
                        {currentUser.status === "ACTIVE" ||
                        (currentUser.status !== "SUSPENDED" &&
                          currentUser.isActive !== false)
                          ? "Active Account"
                          : "Suspended Account"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <LuShield className="h-3 w-3" />
                        Permission Level
                      </label>
                      <p className="text-sm">{currentUser.role || "USER"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
