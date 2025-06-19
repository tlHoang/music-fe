"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  UserGrowthChart,
  TrackDistributionChart,
} from "@/components/admin/dashboard-charts";
import {
  LuUsers,
  LuMusic,
  LuListMusic,
  LuUserCheck,
  LuEye,
  LuEyeOff,
  LuUserPlus,
  LuUpload,
  LuCirclePlay,
  LuThumbsUp,
  LuPlus,
  LuActivity,
  LuStar,
} from "react-icons/lu";

interface ActivityItem {
  _id: string;
  type: string;
  message: string;
  timestamp: string;
  userId?: {
    _id: string;
    username: string;
    profilePicture?: string;
  };
  targetId?: string;
  targetType?: string;
  targetName?: string;
}

interface Stats {
  users: number;
  activeUsers: number;
  tracks: number;
  publicTracks: number;
  privateTracks: number;
  playlists: number;
  newUsers: number;
  newTracks: number;
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  loading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  description?: string;
  loading: boolean;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-10 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value.toLocaleString()}</div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardPage = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({
    users: 0,
    activeUsers: 0,
    tracks: 0,
    publicTracks: 0,
    privateTracks: 0,
    playlists: 0,
    newUsers: 0,
    newTracks: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);

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
        const responseData = await statsResponse.json(); // Handle nested structure, common in APIs
        setStatsData(responseData); // Store the full stats data for charts

        if (
          responseData &&
          responseData.data &&
          responseData.data.success &&
          responseData.data.data &&
          responseData.data.data.counts
        ) {
          const counts = responseData.data.data.counts;
          setStats({
            users: counts.totalUsers || 0,
            activeUsers: counts.activeUsers || 0,
            tracks: counts.totalSongs || 0,
            publicTracks: counts.publicSongs || 0,
            privateTracks: counts.privateSongs || 0,
            playlists: counts.totalPlaylists || 0,
            newUsers: counts.newUsers || 0,
            newTracks: counts.newSongs || 0,
          });
        } else if (
          responseData &&
          responseData.data &&
          responseData.data.counts
        ) {
          const counts = responseData.data.counts;
          setStats({
            users: counts.totalUsers || 0,
            activeUsers: counts.activeUsers || 0,
            tracks: counts.totalSongs || 0,
            publicTracks: counts.publicSongs || 0,
            privateTracks: counts.privateSongs || 0,
            playlists: counts.totalPlaylists || 0,
            newUsers: counts.newUsers || 0,
            newTracks: counts.newSongs || 0,
          });
        } else if (
          statsData &&
          statsData.success &&
          statsData.data &&
          statsData.data.counts
        ) {
          const counts = statsData.data.counts;
          setStats({
            users: counts.totalUsers || 0,
            activeUsers: counts.activeUsers || 0,
            tracks: counts.totalSongs || 0,
            publicTracks: counts.publicSongs || 0,
            privateTracks: counts.privateSongs || 0,
            playlists: counts.totalPlaylists || 0,
            newUsers: counts.newUsers || 0,
            newTracks: counts.newSongs || 0,
          });
        } else {
          console.error("Unexpected stats data format:", statsData);
        }

        // Fetch recent activity data
        const activityResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/activity?limit=10`,
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

        // Handle the deeply nested structure
        if (
          activityData &&
          activityData.data &&
          activityData.data.success &&
          activityData.data.data &&
          Array.isArray(activityData.data.data.activities)
        ) {
          setRecentActivity(activityData.data.data.activities);
        } else if (
          activityData &&
          activityData.data &&
          Array.isArray(activityData.data.activities)
        ) {
          setRecentActivity(activityData.data.activities);
        } else {
          console.error("Unexpected activity data format:", activityData);
          setRecentActivity([]);
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
      default:
        return <LuActivity className="h-6 w-6 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your platform's statistics and recent activity.
        </p>
      </div>{" "}
      {/* Statistics Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.users}
          icon={LuUsers}
          description="All registered users"
          loading={isLoading}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          icon={LuUserCheck}
          description="Recently active"
          loading={isLoading}
        />
        <StatCard
          title="New Users"
          value={stats.newUsers}
          icon={LuUserPlus}
          description="Recent registrations"
          loading={isLoading}
        />
        <StatCard
          title="Total Playlists"
          value={stats.playlists}
          icon={LuListMusic}
          description="User created lists"
          loading={isLoading}
        />
        <StatCard
          title="Total Tracks"
          value={stats.tracks}
          icon={LuMusic}
          description="All uploaded tracks"
          loading={isLoading}
        />
        <StatCard
          title="Public Tracks"
          value={stats.publicTracks}
          icon={LuEye}
          description="Publicly available"
          loading={isLoading}
        />
        <StatCard
          title="Private Tracks"
          value={stats.privateTracks}
          icon={LuEyeOff}
          description="Private uploads"
          loading={isLoading}
        />
        <StatCard
          title="New Tracks"
          value={stats.newTracks}
          icon={LuUpload}
          description="Recently uploaded"
          loading={isLoading}
        />
      </div>
      {/* Charts Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Analytics</h3>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 items-start">
          {/* User Growth Chart with real data */}
          <div className="w-full">
            <UserGrowthChart
              data={
                statsData?.data?.data?.userGrowth
                  ? statsData.data.data.userGrowth.map(
                      (item: { _id: string; count: number }) => ({
                        name: item._id.split("-").slice(1).join("/"), // Convert YYYY-MM-DD to MM/DD
                        users: item.count,
                      })
                    )
                  : undefined
              }
            />
          </div>
          {/* Track Distribution with real data */}
          <div className="w-full">
            <TrackDistributionChart
              data={[
                { name: "Public", value: stats.publicTracks || 0 },
                { name: "Private", value: stats.privateTracks || 0 },
              ]}
            />
          </div>
        </div>
      </div>
      {/* Recent Activity Section */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {isLoading ? (
                // Loading skeletons
                Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="flex items-center p-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="ml-4 space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-start p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="rounded-full p-2 bg-primary/10">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="ml-4 flex-1">
                      {" "}
                      <div className="flex items-center justify-between">
                        {activity.userId?.username && (
                          <Link
                            href={`/admin/users/${activity.userId._id}`}
                            className="font-medium hover:underline"
                          >
                            {activity.userId.username}
                          </Link>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(activity.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.message}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-muted-foreground">
                  No recent activity found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>      </div>
    </div>
  );
};

export default DashboardPage;
