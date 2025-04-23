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
import Link from "next/link";
import { toast } from "sonner";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  profilePicture?: string;
  createdAt: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  trackCount?: number;
  playlistCount?: number;
  lastActive?: string;
  isVerified?: boolean;
}

const UsersPage = () => {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // Fetch users from API
  useEffect(() => {
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
        if (data.data) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [session]);

  // Filter users based on search and filters
  useEffect(() => {
    if (users.length > 0) {
      const filtered = users.filter((user) => {
        const matchesSearch =
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && user.status === "ACTIVE") ||
          (statusFilter === "suspended" && user.status === "SUSPENDED") ||
          (statusFilter === "unverified" && user.isVerified === false);

        const matchesRole =
          roleFilter === "all" ||
          user.role.toLowerCase() === roleFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesRole;
      });
      setFilteredUsers(filtered);
    }
  }, [users, searchQuery, statusFilter, roleFilter]);

  const handleUserAction = async (action: string, userId: string) => {
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

        setUsers(users.filter((user) => user._id !== userId));
        toast.success("User deleted successfully");
      } else if (action === "suspend" || action === "activate") {
        const status = action === "suspend" ? "SUSPENDED" : "ACTIVE";
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

        setUsers(
          users.map((user) =>
            user._id === userId ? { ...user, status } : user
          )
        );
        toast.success(
          `User ${action === "suspend" ? "suspended" : "activated"} successfully`
        );
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
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      toast.error(`Failed to ${action} user`);
    }
  };

  const getDefaultProfileImage = () => {
    return "/default-profile.jpg";
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role.toUpperCase()) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "MODERATOR":
        return "bg-purple-100 text-purple-800";
      case "ARTIST":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Button onClick={() => console.log("Create new user")}>
          Add New User
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search by name or email"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="w-full p-2 border rounded-md"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="unverified">Unverified</option>
        </select>
        <select
          className="w-full p-2 border rounded-md"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="artist">Artist</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
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
                  Content
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Joined
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <Avatar className="h-10 w-10">
                            <img
                              src={
                                user.profilePicture || getDefaultProfileImage()
                              }
                              alt={user.name}
                            />
                          </Avatar>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          {!user.isVerified && (
                            <div className="text-xs text-amber-600">
                              Unverified
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(user.status)}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        <div>{user.trackCount || 0} tracks</div>
                        <div>{user.playlistCount || 0} playlists</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
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
                              window.open(`/profile/${user._id}`, "_blank")
                            }
                          >
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => console.log("Edit user", user._id)}
                          >
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.role.toUpperCase() !== "ADMIN" ? (
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
                          )}
                          {user.status.toUpperCase() === "ACTIVE" ? (
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
                          <DropdownMenuItem
                            onClick={() => handleUserAction("delete", user._id)}
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
            Showing <span className="font-medium">{filteredUsers.length}</span>{" "}
            users
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

export default UsersPage;
