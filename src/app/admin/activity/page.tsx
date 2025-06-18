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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { LuSearch, LuMessageSquareMore, LuCalendarRange } from "react-icons/lu";
import {
  LuUserPlus,
  LuUpload,
  LuCirclePlay,
  LuThumbsUp,
  LuPlus,
  LuMessageSquare,
  LuActivity,
} from "react-icons/lu";
import { format } from "date-fns";

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
  const [typeFilter, setTypeFilter] = useState("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentActivityId, setCurrentActivityId] = useState("");

  // Date filter
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalActivities, setTotalActivities] = useState(0);
  const activitiesPerPage = 20;
  const totalPages = Math.ceil(totalActivities / activitiesPerPage);

  const fetchActivities = async () => {
    if (!session?.user?.access_token) return;

    try {
      setIsLoading(true);

      // Build query parameters
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: activitiesPerPage.toString(),
      });

      if (typeFilter !== "all") {
        queryParams.append("type", typeFilter);
      }

      // Add date filters if applicable
      if (dateFilter === "custom" && customStartDate) {
        queryParams.append(
          "startDate",
          new Date(customStartDate).toISOString()
        );

        if (customEndDate) {
          queryParams.append("endDate", new Date(customEndDate).toISOString());
        }
      } else if (dateFilter === "today") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        queryParams.append("startDate", today.toISOString());
      } else if (dateFilter === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        queryParams.append("startDate", weekAgo.toISOString());
      } else if (dateFilter === "month") {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        queryParams.append("startDate", monthAgo.toISOString());
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/activity?${queryParams.toString()}`,
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
        data.data.data &&
        Array.isArray(data.data.data.activities)
      ) {
        setActivities(data.data.data.activities);
        setTotalActivities(
          data.data.data.totalCount || data.data.data.activities.length
        );
      } else if (data && data.data && Array.isArray(data.data.activities)) {
        setActivities(data.data.activities);
        setTotalActivities(data.data.totalCount || data.data.activities.length);
      } else if (data && Array.isArray(data)) {
        setActivities(data);
        setTotalActivities(data.length);
      } else {
        console.error("Unexpected data structure:", data);
        toast.error("Invalid data format received");
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to load activity data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [session, currentPage, typeFilter, dateFilter]);

  // Update custom date filters when they change
  useEffect(() => {
    if (dateFilter === "custom" && (customStartDate || customEndDate)) {
      fetchActivities();
    }
  }, [customStartDate, customEndDate]);

  // Filter activities based on search query
  const filteredActivities = useMemo(() => {
    if (!searchQuery) return activities;

    return activities.filter((activity) => {
      return (
        activity.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.userId?.name
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        activity.targetName
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        activity.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        false
      );
    });
  }, [activities, searchQuery]);

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

    return format(past, "MMM d, yyyy 'at' h:mm a");
  };

  // Gets the appropriate icon for different activity types
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "USER_REGISTERED":
        return <LuUserPlus className="h-6 w-6 text-blue-500" />;
      case "TRACK_UPLOADED":
        return <LuUpload className="h-6 w-6 text-green-500" />;
      case "TRACK_PLAYED":
        return <LuCirclePlay className="h-6 w-6 text-purple-500" />;
      case "TRACK_LIKED":
      case "PLAYLIST_LIKED":
        return <LuThumbsUp className="h-6 w-6 text-red-500" />;
      case "PLAYLIST_CREATED":
        return <LuPlus className="h-6 w-6 text-yellow-500" />;
      case "COMMENT_ADDED":
        return <LuMessageSquare className="h-6 w-6 text-orange-500" />;
      default:
        return <LuActivity className="h-6 w-6 text-gray-500" />;
    }
  };

  // Handle deleting an activity log entry
  const handleDeleteActivity = (activityId: string) => {
    setCurrentActivityId(activityId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteActivity = async () => {
    if (!currentActivityId || !session?.user?.access_token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/activity/${currentActivityId}`,
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

      toast.success("Activity log entry deleted successfully");
      setActivities(
        activities.filter((activity) => activity._id !== currentActivityId)
      );
    } catch (error) {
      console.error("Error deleting activity log entry:", error);
      toast.error("Failed to delete activity log entry");
    } finally {
      setIsDeleteDialogOpen(false);
      setCurrentActivityId("");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
          <p className="text-muted-foreground">
            Monitor user activity and system events.
          </p>
        </div>
      </div>

      {/* Search and Filter UI */}
      <div className="flex flex-col space-y-2">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <div className="relative flex-1">
            <LuSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search activity logs..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Activity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="USER_REGISTERED">User Registration</SelectItem>
              <SelectItem value="TRACK_UPLOADED">Track Upload</SelectItem>
              <SelectItem value="TRACK_PLAYED">Track Played</SelectItem>
              <SelectItem value="TRACK_LIKED">Track Like</SelectItem>
              <SelectItem value="PLAYLIST_CREATED">Playlist Created</SelectItem>
              <SelectItem value="PLAYLIST_LIKED">Playlist Like</SelectItem>
              <SelectItem value="COMMENT_ADDED">Comment Added</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchActivities}>Refresh</Button>
        </div>

        {/* Custom date range inputs (shown only when custom is selected) */}
        {dateFilter === "custom" && (
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-center">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <LuCalendarRange className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">From:</span>
              <Input
                type="date"
                className="w-full"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <span className="text-sm">To:</span>
              <Input
                type="date"
                className="w-full"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setCustomStartDate("");
                setCustomEndDate("");
              }}
            >
              Clear Dates
            </Button>
          </div>
        )}
      </div>

      {/* Activity List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoading ? (
              // Loading skeletons
              Array(10)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-start p-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="ml-4 space-y-2 flex-1">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[80px]" />
                      </div>
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))
            ) : filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => (
                <div
                  key={activity._id}
                  className="flex items-start p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-shrink-0 mr-4">
                    <div className="rounded-full p-2 bg-primary/10">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {activity.userId && (
                          <>
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage
                                src={activity.userId.profilePicture}
                              />
                              <AvatarFallback>
                                {activity.userId.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <Link
                              href={`/admin/users/${activity.userId._id}`}
                              className="font-medium hover:underline truncate"
                            >
                              {activity.userId.name}
                            </Link>
                          </>
                        )}
                        <Badge variant="outline" className="ml-2 text-xs">
                          {activity.type}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm mt-1 break-words">
                      {activity.message}
                    </p>
                    {(activity.targetType || activity.targetName) && (
                      <div className="flex items-center mt-1 text-xs text-muted-foreground">
                        <span className="truncate">
                          {activity.targetType && `${activity.targetType}: `}
                          {activity.targetName && (
                            <span className="font-medium">
                              {activity.targetName}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      {" "}
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        <span className="sr-only">Open menu</span>
                        <LuMessageSquareMore className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {activity.userId && (
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${activity.userId._id}`}>
                            View User Profile
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {activity.targetId && activity.targetType === "Track" && (
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/tracks/${activity.targetId}`}>
                            View Track Details
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {activity.targetId &&
                        activity.targetType === "Playlist" && (
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/admin/playlists/${activity.targetId}`}
                            >
                              View Playlist Details
                            </Link>
                          </DropdownMenuItem>
                        )}
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => handleDeleteActivity(activity._id)}
                      >
                        Delete Log Entry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">
                  No activity logs found matching your filters.
                </p>
              </div>
            )}
          </div>
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

      {/* Delete Activity Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this activity log entry? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onClick={confirmDeleteActivity}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActivityPage;
