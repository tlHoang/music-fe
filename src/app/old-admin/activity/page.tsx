"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

const ActivityPage = () => {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchActivities();
  }, [session, page, activityTypeFilter]);

  const fetchActivities = async () => {
    if (!session?.user?.access_token) return;

    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        type: activityTypeFilter !== "all" ? activityTypeFilter : "",
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/activity?${queryParams}`,
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
        setActivities(data.data.activities || []);
        setTotalPages(data.data.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to load activity data");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = 
      activity.message?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      activity.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      false;
    
    return matchesSearch;
  });

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

  // Format full date for the activity item
  const formatFullDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case "USER_REGISTERED":
        return "Registration";
      case "TRACK_UPLOADED":
        return "Upload";
      case "PLAYLIST_CREATED":
        return "Playlist";
      case "COMMENT_ADDED":
        return "Comment";
      case "TRACK_LIKED":
        return "Track Like";
      case "PLAYLIST_LIKED":
        return "Playlist Like";
      default:
        return type.replace("_", " ").toLowerCase();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search by description or user"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="w-full p-2 border rounded-md"
          value={activityTypeFilter}
          onChange={(e) => {
            setActivityTypeFilter(e.target.value);
            setPage(1); // Reset to first page when changing filter
          }}
        >
          <option value="all">All Activity Types</option>
          <option value="USER_REGISTERED">Registrations</option>
          <option value="TRACK_UPLOADED">Uploads</option>
          <option value="PLAYLIST_CREATED">Playlists</option>
          <option value="COMMENT_ADDED">Comments</option>
          <option value="TRACK_LIKED">Track Likes</option>
          <option value="PLAYLIST_LIKED">Playlist Likes</option>
        </select>
      </div>

      {/* Activity Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading activity data...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No activities found</p>
            </div>
          ) : (
            <div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredActivities.map((activity) => (
                    <tr key={activity._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getActivityIcon(activity.type)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {getActivityTypeLabel(activity.type)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {activity.userId ? (
                          <Link href={`/admin/users?id=${activity.userId._id}`} className="flex items-center">
                            <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                              {activity.userId.name}
                            </div>
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-500">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {activity.message}
                          {activity.targetType && activity.targetId && (
                            <Link
                              href={`/${activity.targetType.toLowerCase()}/${activity.targetId}`}
                              className="font-medium text-blue-600 hover:text-blue-800 ml-1"
                            >
                              {activity.targetName || activity.targetType.toLowerCase()}
                            </Link>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={formatFullDate(activity.timestamp)}>
                        {formatRelativeTime(activity.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">{filteredActivities.length}</span> activities
                </div>
                <div className="flex-1 flex justify-end">
                  <Button 
                    onClick={() => setPage(Math.max(1, page - 1))} 
                    disabled={page === 1}
                    className="mr-3"
                  >
                    Previous
                  </Button>
                  <Button 
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;