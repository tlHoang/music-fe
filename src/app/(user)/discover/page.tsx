"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { sendRequest } from "@/utils/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";

interface User {
  _id: string;
  name?: string;
  email: string;
  avatar?: string;
  followersCount: number;
  tracksCount: number;
  isFollowing?: boolean;
}

const DiscoverPage = () => {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [followUpdates, setFollowUpdates] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    fetchUsers();
  }, [session]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/users/discover`,
        headers: session?.user?.access_token
          ? { Authorization: `Bearer ${session.user.access_token}` }
          : undefined,
        method: "GET",
      });

      if (response.data) {
        console.log("Users data from API:", response.data);
        // Initialize followUpdates with current follow status from API
        const initialFollowStates: Record<string, boolean> = {};
        response.data.forEach((user: User) => {
          initialFollowStates[user._id] = !!user.isFollowing;
        });
        setFollowUpdates(initialFollowStates);
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load artists. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!session?.user?.access_token) {
      window.location.href = "/login";
      return;
    }

    try {
      // Optimistic UI update
      setFollowUpdates({ ...followUpdates, [userId]: true });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/followers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            followingId: userId,
            followerId: session.user._id,
          }),
        }
      );

      const data = await response.json();
      console.log("Follow response:", data);

      if (!data.data.success) {
        // Revert optimistic update on failure
        setFollowUpdates({ ...followUpdates, [userId]: false });
      }
    } catch (error) {
      console.error("Error following user:", error);
      setFollowUpdates({ ...followUpdates, [userId]: false });
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      // Optimistic UI update
      setFollowUpdates({ ...followUpdates, [userId]: false });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/followers/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
        }
      );

      const data = await response.json();

      if (!data.data.success) {
        // Revert optimistic update on failure
        setFollowUpdates({ ...followUpdates, [userId]: true });
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      setFollowUpdates({ ...followUpdates, [userId]: true });
    }
  };

  // Get follow status considering optimistic updates
  const getFollowStatus = (user: User) => {
    if (followUpdates[user._id] !== undefined) {
      return followUpdates[user._id];
    }
    return user.isFollowing || false;
  };

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    return user.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <p className="text-xl">Loading artists...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Discover Artists</h1>
          <p className="text-gray-600">
            Find new artists to follow and explore their music
          </p>
        </div>
        <Link href="/homepage/feed">
          <Button variant="outline">Back to Feed</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="mb-8">
        <Input
          type="text"
          placeholder="Search artists by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-4">No artists found</h2>
          <p className="text-gray-600">
            {searchQuery
              ? "No artists match your search query."
              : "No artists available right now."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                    <Image
                      src={user.avatar || "/default-profile.jpg"}
                      alt={user._id}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div>
                    <Link href={`/profile/${user._id}`}>
                      <h3 className="font-semibold text-lg hover:text-blue-600">
                        {user.name || user.email}
                      </h3>
                    </Link>
                    <div className="text-sm text-gray-500 flex gap-3">
                      <span>{user.followersCount || 0} followers</span>
                      <span>•</span>
                      <span>{user.tracksCount || 0} tracks</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Link href={`/profile/${user._id}`}>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </Link>

                  {session?.user?._id !== user._id &&
                    (getFollowStatus(user) ? (
                      <Button
                        variant="outline"
                        onClick={() => handleUnfollow(user._id)}
                        size="sm"
                      >
                        Unfollow
                      </Button>
                    ) : (
                      <Button onClick={() => handleFollow(user._id)} size="sm">
                        Follow
                      </Button>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscoverPage;
