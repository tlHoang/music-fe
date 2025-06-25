"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Crown,
  Music,
  ListMusic,
  AlertTriangle,
  TrendingUp,
  Infinity,
} from "lucide-react";

interface SubscriptionStats {
  subscription: {
    plan: string;
  };
  limits: {
    maxSongs: number;
    maxPlaylists: number;
    maxFileSize: number;
  };
  usage: {
    songs: {
      current: number;
      max: number;
      percentage: number;
    };
    playlists: {
      current: number;
      max: number;
      percentage: number;
    };
  };
}

const PLAN_COLORS = {
  FREE: "#64748b",
  PREMIUM: "#3b82f6",
  PREMIUM_PLUS: "#8b5cf6",
};

const CHART_COLORS = {
  used: "#3b82f6",
  available: "#e2e8f0",
  warning: "#f59e0b",
  danger: "#ef4444",
};

export default function SubscriptionStatsComponent() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchSubscriptionStats = useCallback(async () => {
    if (!session?.user?.access_token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/stats`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setStats(result.data || result);
    } catch (err) {
      console.error("Error fetching subscription stats:", err);
      setError("Failed to load subscription statistics");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.access_token]);

  useEffect(() => {
    fetchSubscriptionStats();
  }, [fetchSubscriptionStats]);
  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case "PREMIUM":
        return "default";
      case "PREMIUM_PLUS":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getUsageColor = (percentage: number, isUnlimited: boolean) => {
    if (isUnlimited) return CHART_COLORS.used;
    if (percentage >= 90) return CHART_COLORS.danger;
    if (percentage >= 70) return CHART_COLORS.warning;
    return CHART_COLORS.used;
  };

  const getUsageData = () => {
    if (!stats) return [];

    const songUsage = stats.usage.songs;
    const playlistUsage = stats.usage.playlists;

    return [
      {
        category: "Songs",
        used: songUsage.current,
        available:
          songUsage.max === -1
            ? 0
            : Math.max(0, songUsage.max - songUsage.current),
        total: songUsage.max === -1 ? songUsage.current : songUsage.max,
        percentage: songUsage.percentage,
        unlimited: songUsage.max === -1,
      },
      {
        category: "Playlists",
        used: playlistUsage.current,
        available:
          playlistUsage.max === -1
            ? 0
            : Math.max(0, playlistUsage.max - playlistUsage.current),
        total:
          playlistUsage.max === -1 ? playlistUsage.current : playlistUsage.max,
        percentage: playlistUsage.percentage,
        unlimited: playlistUsage.max === -1,
      },
    ];
  };

  const getPieData = () => {
    const data = getUsageData();
    return data.map((item) => ({
      name: item.category,
      value: item.used,
      color: getUsageColor(item.percentage, item.unlimited),
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === -1) return "Unlimited";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb.toFixed(1)} MB`;
  };

  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case "PREMIUM":
        return "Premium";
      case "PREMIUM_PLUS":
        return "Premium Plus";
      case "FREE":
        return "Free";
      default:
        return plan;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={fetchSubscriptionStats}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No subscription data available</p>
      </div>
    );
  }
  const usageData = getUsageData();
  const pieData = getPieData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          Subscription Analytics
        </h2>{" "}
        <Badge
          variant={getPlanBadgeVariant(stats.subscription.plan)}
          className="text-sm"
        >
          {getPlanDisplayName(stats.subscription.plan)}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Plan */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {" "}
            <div
              className="text-2xl font-bold"
              style={{
                color:
                  PLAN_COLORS[
                    stats.subscription.plan as keyof typeof PLAN_COLORS
                  ],
              }}
            >
              {getPlanDisplayName(stats.subscription.plan)}
            </div>
          </CardContent>
        </Card>

        {/* Songs Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Music className="h-4 w-4" />
              Songs Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">
                {stats.usage.songs.current}
              </span>
              <span className="text-sm text-gray-500">
                {stats.usage.songs.max === -1 ? (
                  <Infinity className="h-4 w-4" />
                ) : (
                  `/ ${stats.usage.songs.max}`
                )}
              </span>
            </div>
            {stats.usage.songs.max !== -1 && (
              <Progress
                value={stats.usage.songs.percentage}
                className="h-2"
                color={getUsageColor(stats.usage.songs.percentage, false)}
              />
            )}
            <p className="text-sm text-gray-500 mt-1">
              {stats.usage.songs.max === -1
                ? "Unlimited"
                : `${stats.usage.songs.percentage}% used`}
            </p>
          </CardContent>
        </Card>

        {/* Playlists Usage */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ListMusic className="h-4 w-4" />
              Playlists Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">
                {stats.usage.playlists.current}
              </span>
              <span className="text-sm text-gray-500">
                {stats.usage.playlists.max === -1 ? (
                  <Infinity className="h-4 w-4" />
                ) : (
                  `/ ${stats.usage.playlists.max}`
                )}
              </span>
            </div>
            {stats.usage.playlists.max !== -1 && (
              <Progress
                value={stats.usage.playlists.percentage}
                className="h-2"
                color={getUsageColor(stats.usage.playlists.percentage, false)}
              />
            )}
            <p className="text-sm text-gray-500 mt-1">
              {stats.usage.playlists.max === -1
                ? "Unlimited"
                : `${stats.usage.playlists.percentage}% used`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    name === "used" ? `${value} used` : `${value} available`,
                    name === "used" ? "Used" : "Available",
                  ]}
                />
                <Legend />
                <Bar dataKey="used" fill={CHART_COLORS.used} name="Used" />
                <Bar
                  dataKey="available"
                  fill={CHART_COLORS.available}
                  name="Available"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, "Items"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Limits Details */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Limits & Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Music className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="font-bold text-lg">
                {stats.limits.maxSongs === -1
                  ? "Unlimited"
                  : stats.limits.maxSongs}
              </div>
              <div className="text-sm text-gray-500">Max Songs</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <ListMusic className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="font-bold text-lg">
                {stats.limits.maxPlaylists === -1
                  ? "Unlimited"
                  : stats.limits.maxPlaylists}
              </div>
              <div className="text-sm text-gray-500">Max Playlists</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Crown className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="font-bold text-lg">
                {formatFileSize(stats.limits.maxFileSize)}
              </div>
              <div className="text-sm text-gray-500">Max File Size</div>
            </div>
          </div>{" "}
        </CardContent>
      </Card>
    </div>
  );
}
