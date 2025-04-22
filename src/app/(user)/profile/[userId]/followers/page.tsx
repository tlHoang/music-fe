"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

interface User {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
  isFollowing?: boolean;
}

const FollowersPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const [followers, setFollowers] = useState<User[]>([]);
  const [userDetails, setUserDetails] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followUpdates, setFollowUpdates] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    fetchUserDetails();
    fetchFollowers();
  }, [userId, session]);

  const fetchUserDetails = async () => {
    try {
      const headers: HeadersInit = {};
      if (session?.user?.access_token) {
        headers["Authorization"] = `Bearer ${session.user.access_token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.data) {
        setUserDetails({ name: result.data.name });
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const fetchFollowers = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers: HeadersInit = {};
      if (session?.user?.access_token) {
        headers["Authorization"] = `Bearer ${session.user.access_token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/followers/${userId}/followers`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result) {
        setFollowers(result);
      }
    } catch (error) {
      console.error("Error fetching followers:", error);
      setError("Failed to load followers. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (followId: string) => {
    if (!session?.user?.access_token) {
      router.push("/login");
      return;
    }

    try {
      // Optimistic UI update immediately
      setFollowUpdates({ ...followUpdates, [followId]: true });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/followers`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            followingId: followId,
          }),
        }
      );

      if (!response.ok) {
        // Revert optimistic update on failure
        setFollowUpdates({ ...followUpdates, [followId]: false });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update followers data to reflect the change
      setFollowers(
        followers.map((follower) =>
          follower._id === followId
            ? { ...follower, isFollowing: true }
            : follower
        )
      );
    } catch (error) {
      console.error("Error following user:", error);
      setFollowUpdates({ ...followUpdates, [followId]: false });
    }
  };

  const handleUnfollow = async (followId: string) => {
    if (!session?.user?.access_token) {
      return;
    }

    try {
      // Optimistic UI update immediately
      setFollowUpdates({ ...followUpdates, [followId]: false });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/followers/${followId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
        }
      );

      if (!response.ok) {
        // Revert optimistic update on failure
        setFollowUpdates({ ...followUpdates, [followId]: true });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update followers data to reflect the change
      setFollowers(
        followers.map((follower) =>
          follower._id === followId
            ? { ...follower, isFollowing: false }
            : follower
        )
      );
    } catch (error) {
      console.error("Error unfollowing user:", error);
      setFollowUpdates({ ...followUpdates, [followId]: true });
    }
  };

  // Get follow status considering optimistic updates
  const getFollowStatus = (user: User) => {
    if (followUpdates[user._id] !== undefined) {
      return followUpdates[user._id];
    }
    return user.isFollowing || false;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <p className="text-xl">Loading followers...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="w-10 p-0"
        >
          ←
        </Button>
        <h1 className="text-2xl font-bold">
          {userDetails?.name ? `${userDetails.name}'s Followers` : "Followers"}
        </h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {followers.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-4">No followers yet</h2>
          <p className="text-gray-600">
            This user doesn't have any followers yet.
          </p>
        </div>
      ) : (
        <ul className="bg-white rounded-lg shadow divide-y divide-gray-200">
          {followers.map((follower) => (
            <li
              key={follower._id}
              className="p-4 flex items-center justify-between"
            >
              <Link
                href={`/profile/${follower._id}`}
                className="flex items-center flex-grow"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                  <Image
                    src={follower.avatar || "/default-profile.jpg"}
                    alt={follower.name}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                </div>
                <span className="font-medium text-lg">{follower.name}</span>
              </Link>

              {session?.user?._id !== follower._id &&
                (getFollowStatus(follower) ? (
                  <Button
                    variant="outline"
                    onClick={() => handleUnfollow(follower._id)}
                    className="ml-auto"
                  >
                    Unfollow
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleFollow(follower._id)}
                    className="ml-auto"
                  >
                    Follow
                  </Button>
                ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FollowersPage;
