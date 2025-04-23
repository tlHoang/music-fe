"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface ActivityItem {
  _id: string;
  type: string;
  message: string;
  timestamp: string;
  userId?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  targetId?: string;
  targetType?: string;
  targetName?: string;
}

interface Stats {
  users: number;
  tracks: number;
  playlists: number;
  comments: number;
  likes: number;
}

const DashboardPage = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({
    users: 0,
    tracks: 0,
    playlists: 0,
    comments: 0,
    likes: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!session?.user?.access_token) return;

      try {
        setIsLoading(true);

        // Fetch statistics data
        const statsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard/stats`,
          {
            headers: {
              Authorization: `Bearer ${session.user.access_token}`,
            },
          }
        );

        if (!statsResponse.ok) {
          throw new Error(`HTTP error fetching stats: ${statsResponse.status}`);
        }

        const statsData = (await statsResponse.json()).data;
        console.log("Stats Data:", statsData);
        if (statsData.data) {
          setStats(statsData.data);
        }

        // Fetch recent activity data
        const activityResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/activity`,
          {
            headers: {
              Authorization: `Bearer ${session.user.access_token}`,
            },
          }
        );

        if (!activityResponse.ok) {
          throw new Error(
            `HTTP error fetching activity: ${activityResponse.status}`
          );
        }

        const activityData = await activityResponse.json();
        if (activityData.data) {
          setRecentActivity(activityData.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [session]);

  // Formats a timestamp to a relative time string (e.g., "2 hours ago")
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffSecs = Math.round(diffMs / 1000);
    const diffMins = Math.round(diffSecs / 60);
    const diffHours = Math.round(diffMins / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSecs < 60) return `${diffSecs} seconds ago`;
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;

    return past.toLocaleDateString();
  };

  // Gets the appropriate icon for different activity types
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "USER_REGISTERED":
        return (
          <div className="bg-blue-100 p-3 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
        );
      case "TRACK_UPLOADED":
        return (
          <div className="bg-green-100 p-3 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
        );
      case "PLAYLIST_CREATED":
        return (
          <div className="bg-purple-100 p-3 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
        );
      case "COMMENT_ADDED":
        return (
          <div className="bg-yellow-100 p-3 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
          </div>
        );
      case "TRACK_LIKED":
      case "PLAYLIST_LIKED":
        return (
          <div className="bg-red-100 p-3 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className="bg-gray-100 p-3 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700">Users</h2>
            <div className="p-2 bg-blue-500 rounded-full text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold">
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              stats.users
            )}
          </p>
          <div className="mt-4">
            <Link
              href="/admin/users"
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              View all users
            </Link>
          </div>
        </div>

        {/* Tracks Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700">Tracks</h2>
            <div className="p-2 bg-green-500 rounded-full text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold">
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              stats.tracks
            )}
          </p>
          <div className="mt-4">
            <Link
              href="/admin/tracks"
              className="text-green-500 hover:text-green-700 text-sm font-medium"
            >
              View all tracks
            </Link>
          </div>
        </div>

        {/* Playlists Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700">Playlists</h2>
            <div className="p-2 bg-purple-500 rounded-full text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold">
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              stats.playlists
            )}
          </p>
          <div className="mt-4">
            <Link
              href="/admin/playlists"
              className="text-purple-500 hover:text-purple-700 text-sm font-medium"
            >
              View all playlists
            </Link>
          </div>
        </div>

        {/* Comments Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700">Comments</h2>
            <div className="p-2 bg-yellow-500 rounded-full text-white">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold">
            {isLoading ? (
              <span className="animate-pulse">...</span>
            ) : (
              stats.comments
            )}
          </p>
          <div className="mt-4">
            <span className="text-yellow-500 text-sm font-medium">
              Total comments
            </span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Recent Activity
        </h2>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-4 p-3 animate-pulse bg-gray-50 rounded-lg"
              >
                <div className="bg-gray-200 p-3 rounded-full w-12 h-12"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No recent activity found
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity._id}
                className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg"
              >
                {getActivityIcon(activity.type)}
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    {activity.userId?.name && (
                      <Link
                        href={`/profile/${activity.userId._id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {activity.userId.name}
                      </Link>
                    )}{" "}
                    {activity.message}
                    {activity.targetType && activity.targetId && (
                      <Link
                        href={`/${activity.targetType.toLowerCase()}/${activity.targetId}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {" "}
                        {activity.targetName ||
                          activity.targetType.toLowerCase()}
                      </Link>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatRelativeTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            <div className="pt-4 flex justify-center">
              <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                View all activity
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
