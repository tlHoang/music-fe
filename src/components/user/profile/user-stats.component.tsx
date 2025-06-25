"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Music,
  Heart,
  Play,
  Users,
  Activity,
  ListMusic,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";
import { sendRequest } from "@/utils/api";

interface UserStats {
  overview: {
    totalSongs: number;
    totalPlaylists: number;
    totalPlays: number;
    totalLikes: number;
    followers: number;
    following: number;
  };
  recentActivity: {
    songsThisWeek: number;
    playlistsThisWeek: number;
  };
  topSongs: {
    title: string;
    plays: number;
    likes: number;
    visibility: string;
  }[];
  visibilityDistribution: Record<string, number>;
  monthlyUploads: {
    month: string;
    uploads: number;
  }[];
  engagement: {
    averagePlaysPerSong: number;
    averageLikesPerSong: number;
    totalEngagements: number;
  };
}

interface UserStatsComponentProps {
  userId: string;
}

const COLORS = {
  primary: "#3b82f6",
  secondary: "#10b981",
  accent: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.accent,
  COLORS.purple,
];

export default function UserStatsComponent({
  userId,
}: UserStatsComponentProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await sendRequest<{ success: boolean; data: UserStats }>(
        {
          url: `http://localhost:8888/users/${userId}/stats`,
          method: "GET",
        }
      );

      if (response.success) {
        setStats(response.data);
      } else {
        setError("Failed to fetch user statistics");
      }
    } catch (err) {
      console.error("Error fetching user stats:", err);
      setError("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  };

  const getVisibilityData = () => {
    if (!stats?.visibilityDistribution) return [];

    return Object.entries(stats.visibilityDistribution).map(
      ([key, value], index) => ({
        name: key,
        value,
        color: PIE_COLORS[index % PIE_COLORS.length],
      })
    );
  };

  const getMonthlyData = () => {
    if (!stats?.monthlyUploads) return [];

    // Fill missing months with 0 uploads for better visualization
    const last12Months = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("en", {
        month: "short",
        year: "2-digit",
      });

      const found = stats.monthlyUploads.find(
        (item) => item.month === monthKey
      );
      last12Months.push({
        month: monthName,
        uploads: found ? found.uploads : 0,
      });
    }

    return last12Months;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-red-500 mb-2">📊</div>
          <p className="text-gray-600">{error || "No statistics available"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Songs</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatNumber(stats.overview.totalSongs)}
                </p>
              </div>
              <Music className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">
                  Total Plays
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {formatNumber(stats.overview.totalPlays)}
                </p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Total Likes</p>
                <p className="text-2xl font-bold text-red-900">
                  {formatNumber(stats.overview.totalLikes)}
                </p>
              </div>
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Playlists</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatNumber(stats.overview.totalPlaylists)}
                </p>
              </div>
              <ListMusic className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Followers</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {formatNumber(stats.overview.followers)}
                </p>
              </div>
              <Users className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-sm font-medium">
                  Avg Plays/Song
                </p>
                <p className="text-2xl font-bold text-indigo-900">
                  {stats.engagement.averagePlaysPerSong}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity (This Week)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Songs Uploaded</span>
              <span className="text-xl font-semibold text-blue-600">
                {stats.recentActivity.songsThisWeek}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Playlists Created</span>
              <span className="text-xl font-semibold text-green-600">
                {stats.recentActivity.playlistsThisWeek}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Tabs defaultValue="uploads" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="uploads" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Upload Activity
          </TabsTrigger>
          <TabsTrigger value="top-songs" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Songs
          </TabsTrigger>
          <TabsTrigger value="visibility" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Visibility
          </TabsTrigger>
        </TabsList>

        <TabsContent value="uploads">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Upload Activity (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={getMonthlyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="uploads"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-songs">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Songs</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.topSongs} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="title" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="plays" fill={COLORS.primary} name="Plays" />
                  <Bar dataKey="likes" fill={COLORS.secondary} name="Likes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visibility">
          <Card>
            <CardHeader>
              <CardTitle>Song Visibility Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getVisibilityData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getVisibilityData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Engagement Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {stats.engagement.averagePlaysPerSong}
              </div>
              <div className="text-sm text-gray-600">
                Average Plays per Song
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {stats.engagement.averageLikesPerSong}
              </div>
              <div className="text-sm text-gray-600">
                Average Likes per Song
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {formatNumber(stats.engagement.totalEngagements)}
              </div>
              <div className="text-sm text-gray-600">Total Engagements</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
