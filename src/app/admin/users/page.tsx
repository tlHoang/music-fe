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
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminData } from "@/lib/contexts/AdminDataContext";
import { UsersRefreshButton } from "@/components/dashboard/UsersRefreshButton";

interface User {
  _id: string;
  name?: string;
  username?: string;
  email: string;
  role: "ADMIN" | "USER" | string; // Only ADMIN and USER roles exist
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
  songs?: any[];
  playlists?: any[];
}

const UsersPage = () => {
  const { data: session } = useSession();  // Get users data and loading state from context
  const { users: contextUsers, totalUserCount, isLoadingUsers, fetchUsers, clearUsersCache } = useAdminData();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);
  // Use users from context and load data if needed
  useEffect(() => {
    // Load users data if it doesn't exist in context
    if (!contextUsers || contextUsers.length === 0) {
      fetchUsers();
    } else {
      setUsers(contextUsers);
    }
  }, [contextUsers, fetchUsers]);

  // Refresh users data when session changes
  useEffect(() => {
    if (session?.user?.access_token) {
      fetchUsers();
    }
  }, [session, fetchUsers]);

  // Filter users based on search and filters
  useEffect(() => {
    console.log("Users array length:", users.length);
    console.log("Users array data:", users);

    if (users.length > 0) {
      const filtered = users.filter((user) => {
        // Skip entries that aren't objects or don't have an ID
        if (!user || typeof user !== "object" || !user._id) {
          console.log("Skipping invalid user entry:", user);
          return false;
        }

        // Handle different field naming conventions
        const displayName = user.name || user.username || "";
        const userEmail = user.email || "";
        const userRole = user.role || "";

        // Search matching
        const matchesSearch =
          searchQuery === "" ||
          displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          userEmail.toLowerCase().includes(searchQuery.toLowerCase());        // Status matching - handle both status field and isActive field
        let matchesStatus = true;
        if (statusFilter !== "all") {
          if (statusFilter === "active") {
            // User is considered active if status is ACTIVE or if isActive is true and status isn't explicitly SUSPENDED
            matchesStatus = user.status === "ACTIVE" || (user.isActive === true && user.status !== "SUSPENDED");
          } else if (statusFilter === "suspended") {
            // User is considered suspended if status is SUSPENDED or if isActive is false
            matchesStatus = user.status === "SUSPENDED" || user.isActive === false;
          } else if (statusFilter === "unverified") {
            matchesStatus = user.isVerified === false;
          }
        }

        // Role matching
        const matchesRole =
          roleFilter === "all" ||
          userRole.toLowerCase() === roleFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesRole;
      });

      console.log("Filtered users count:", filtered.length);
      setFilteredUsers(filtered);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / usersPerPage)));

      // Reset to first page when filters change
      if (currentPage > Math.ceil(filtered.length / usersPerPage)) {
        setCurrentPage(1);
      }
    }
  }, [users, searchQuery, statusFilter, roleFilter, usersPerPage]);

  // Handle pagination
  useEffect(() => {
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    setPaginatedUsers(filteredUsers.slice(indexOfFirstUser, indexOfLastUser));
  }, [filteredUsers, currentPage, usersPerPage]);  const handleUserAction = async (action: string, userId: string) => {
    if (!session?.user?.access_token) return;

    try {
      console.log(`${action} user with ID ${userId}`);

      if (action === "delete") {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${session.user.access_token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete user: ${response.status}`);
        }

        // Update local state for immediate UI feedback
        setUsers(users.filter((user) => user._id !== userId));
        toast.success("User deleted successfully");
        
        // Refresh data from API to ensure consistency
        fetchUsers({ force: true });
      } else if (action === "suspend" || action === "activate") {
        const status = action === "suspend" ? "SUSPENDED" : "ACTIVE";
        // Also update isActive field for compatibility with both field systems
        const isActive = action === "activate";
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/status`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.user.access_token}`,
            },
            body: JSON.stringify({ status }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update user status: ${response.status}`);
        }

        // Update both status and isActive in local state for proper UI rendering
        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, status, isActive } : user
          )
        );
        toast.success(
          `User ${action === "suspend" ? "suspended" : "activated"} successfully`
        );
        
        // Refresh data from API to ensure consistency
        fetchUsers({ force: true });
      } else if (action === "promote" || action === "demote") {
        const role = action === "promote" ? "ADMIN" : "USER";
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/role`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.user.access_token}`,
            },
            body: JSON.stringify({ role }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update user role: ${response.status}`);
        }

        setUsers(
          users.map((user) => (user._id === userId ? { ...user, role } : user))
        );
        toast.success(
          `User ${action === "promote" ? "promoted to admin" : "demoted to user"} successfully`
        );
        
        // Refresh data from API to ensure consistency
        fetchUsers({ force: true });
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  const getDefaultProfileImage = () => {
    return "/default-profile.jpg";
  };
  const getRoleBadge = (role: string) => {
    const roleName = role.toUpperCase();
    switch (roleName) {
      case "ADMIN":
        return <Badge variant="destructive">{roleName}</Badge>;
      case "USER":
        return <Badge variant="outline">{roleName}</Badge>;
      default:
        return <Badge variant="outline">{roleName || "USER"}</Badge>;
    }
  };
  const getStatusBadge = (status?: string, isActive?: boolean) => {
    // If we have a status string, use it
    if (status) {
      const statusValue = status.toUpperCase();
      switch (statusValue) {
        case "ACTIVE":
          return <Badge variant="success">ACTIVE</Badge>;
        case "SUSPENDED":
          return <Badge variant="destructive">SUSPENDED</Badge>;
        case "PENDING":
          return <Badge variant="warning">PENDING</Badge>;
        default:
          return <Badge variant="outline">{statusValue}</Badge>;
      }
    }
    
    // Fall back to isActive boolean if no status string is available
    if (isActive !== undefined) {
      return isActive ? 
        <Badge variant="success">ACTIVE</Badge> : 
        <Badge variant="destructive">SUSPENDED</Badge>;
    }
    
    // Default when no status information is available
    return <Badge variant="outline">UNKNOWN</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Pagination controls
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="space-y-6">
      <Card>        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">User Management</CardTitle>          <div className="flex space-x-2">
            <UsersRefreshButton />
            <Button className="bg-gradient-to-r from-indigo-500 to-purple-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add New User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-4">
            Manage your users, set roles and permissions
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <Input
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground mb-2">
            {filteredUsers.length} users found
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      User
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Email
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Role
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Content
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Joined
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          <span>Loading...</span>
                        </div>
                      </td>
                    </tr>
                  ): paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center">
                        <div className="flex flex-col items-center justify-center py-6">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-10 w-10 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1}
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 4a8 8 0 100 16 8 8 0 000-16z"
                            />
                          </svg>
                          <p className="mt-2 text-muted-foreground">
                            No users found
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="border-b transition-colors hover:bg-muted/20"
                      >
                        <td className="p-4">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <img
                                src={
                                  user.profilePicture ||
                                  getDefaultProfileImage()
                                }
                                alt={user.name || user.username || ""}
                              />
                            </Avatar>
                            <div>                              <div className={`font-medium ${user.status === "SUSPENDED" || user.isActive === false ? "text-gray-400" : ""}`}>
                                {user.name || user.username || "Unnamed User"}
                                {(user.status === "SUSPENDED" || user.isActive === false) && (
                                  <span className="ml-1 text-xs text-red-500">(Suspended)</span>
                                )}
                              </div>
                              {user.isVerified === false && (
                                <div className="text-xs text-amber-600">
                                  Unverified
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          {user.email || "No email"}
                        </td>
                        <td className="p-4">
                          {getRoleBadge(user.role || "USER")}
                        </td>                        <td className="p-4">
                          {getStatusBadge(user.status, user.isActive)}
                        </td>
                        <td className="p-4">
                          <div className="text-xs space-y-1">
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 mr-1 text-green-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
                                />
                              </svg>
                              {user.trackCount || user.songs?.length || 0}{" "}
                              tracks
                            </div>
                            <div className="flex items-center">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3 w-3 mr-1 text-purple-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                                />
                              </svg>
                              {user.playlistCount ||
                                user.playlists?.length ||
                                0}{" "}
                              playlists
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm">
                          {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                        </td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <span className="sr-only">Open menu</span>
                                <svg
                                  className="h-4 w-4"
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
                                  window.open(`/profile/${user._id}`, "_blank")
                                }
                              >
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  console.log("Edit user", user._id)
                                }
                              >
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {(user.role || "").toUpperCase() !== "ADMIN" ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUserAction("promote", user._id)
                                  }
                                  className="text-purple-600"
                                >
                                  Promote to Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUserAction("demote", user._id)
                                  }
                                  className="text-blue-600"
                                >
                                  Demote to User
                                </DropdownMenuItem>
                              )}                                    {/* Determine if user is currently active */}
                              {(user.status === "ACTIVE" || (user.isActive === true && user.status !== "SUSPENDED")) ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUserAction("suspend", user._id)
                                  }
                                  className="text-amber-600"
                                >
                                  Suspend User
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleUserAction("activate", user._id)
                                  }
                                  className="text-green-600"
                                >
                                  Activate User
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUserAction("delete", user._id)
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

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {paginatedUsers.length} of {filteredUsers.length} users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show current page and 2 pages before/after when possible
                    let pageToShow = currentPage - 2 + i;
                    // Adjust if we're at the start or end of the page range
                    if (currentPage < 3) {
                      pageToShow = i + 1;
                    } else if (currentPage > totalPages - 2) {
                      pageToShow = totalPages - 4 + i;
                    }

                    // Only show valid page numbers
                    if (pageToShow > 0 && pageToShow <= totalPages) {
                      return (
                        <Button
                          key={pageToShow}
                          variant={
                            currentPage === pageToShow ? "default" : "outline"
                          }
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => paginate(pageToShow)}
                        >
                          {pageToShow}
                        </Button>
                      );
                    }
                    return null;
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
