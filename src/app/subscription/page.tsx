"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, Music, FolderPlus, Upload, Check, Star } from "lucide-react";
import { PaymentButton } from "@/components/PaymentButton";
import { useSession } from "next-auth/react";
import { sendRequest } from "@/utils/api";

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

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  limits: {
    maxSongs: number;
    maxPlaylists: number;
    maxFileSize: number;
  };
}

const planIcons = {
  FREE: Music,
  PREMIUM: Star,
  PREMIUM_PLUS: Crown,
};

const planColors = {
  FREE: "bg-gray-100 text-gray-800",
  PREMIUM: "bg-blue-100 text-blue-800",
  PREMIUM_PLUS: "bg-purple-100 text-purple-800",
};

export default function SubscriptionPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsResponse, plansResponse] = await Promise.all([
        sendRequest<SubscriptionStats>({
          url: "http://localhost:8888/subscriptions/stats",
          method: "GET",
          headers: session?.user?.access_token
            ? { Authorization: `Bearer ${session.user.access_token}` }
            : {},
        }),
        fetch("/api/subscriptions/plans"),
      ]);

      if (statsResponse && plansResponse.ok) {
        const plansData = await plansResponse.json();
        setStats(statsResponse);
        setPlans(plansData.data || []);
      }
    } catch (error) {
      console.error("Error fetching subscription data:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const handleUpgrade = async (plan: Plan) => {
    setUpgrading(plan.id);
    // The PaymentButton will handle the upgrade process
  };

  const formatFileSize = (bytes: number) => {
    return Math.round(bytes / (1024 * 1024)) + "MB";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Subscription
          </h1>
          <p className="text-xl text-gray-600">
            Manage your plan and track your usage
          </p>
        </div>

        {/* Current Subscription Status */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subscription Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    {(() => {
                      const Icon =
                        planIcons[
                          stats.subscription.plan as keyof typeof planIcons
                        ] || Music;
                      return <Icon className="w-6 h-6 mr-2" />;
                    })()}
                    Current Plan
                  </CardTitle>
                  <Badge
                    className={
                      planColors[
                        stats.subscription.plan as keyof typeof planColors
                      ] || planColors.FREE
                    }
                  >
                    {stats.subscription.plan.replace("_", " ")}
                  </Badge>
                </div>{" "}
                <CardDescription>Permanent subscription</CardDescription>
              </CardHeader>{" "}
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-gray-600">
                    Enjoy your{" "}
                    {stats.subscription.plan.replace("_", " ").toLowerCase()}{" "}
                    plan!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Usage Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="w-6 h-6 mr-2" />
                  Usage Statistics
                </CardTitle>
                <CardDescription>
                  Track your current usage against plan limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Songs Usage */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Songs Uploaded</span>
                    <span className="text-sm text-gray-500">
                      {stats.usage.songs.current} /{" "}
                      {stats.usage.songs.max === -1
                        ? "∞"
                        : stats.usage.songs.max}
                    </span>
                  </div>
                  <Progress
                    value={
                      stats.usage.songs.max === -1
                        ? 0
                        : stats.usage.songs.percentage
                    }
                    className="h-2"
                  />
                </div>

                {/* Playlists Usage */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Playlists Created
                    </span>
                    <span className="text-sm text-gray-500">
                      {stats.usage.playlists.current} /{" "}
                      {stats.usage.playlists.max === -1
                        ? "∞"
                        : stats.usage.playlists.max}
                    </span>
                  </div>
                  <Progress
                    value={
                      stats.usage.playlists.max === -1
                        ? 0
                        : stats.usage.playlists.percentage
                    }
                    className="h-2"
                  />
                </div>

                {/* File Size Limit */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Max File Size</span>
                    <span className="text-sm text-gray-500">
                      {formatFileSize(stats.limits.maxFileSize)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Available Plans */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon =
                planIcons[plan.id as keyof typeof planIcons] || Music;
              const isCurrentPlan = stats?.subscription.plan === plan.id;
              const isFree = plan.price === 0;

              return (
                <Card
                  key={plan.id}
                  className={`relative ${
                    plan.id === "PREMIUM"
                      ? "border-2 border-blue-500 shadow-lg scale-105"
                      : "border border-gray-200"
                  }`}
                >
                  {plan.id === "PREMIUM" && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                      Most Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold">
                      {plan.name}
                    </CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {isFree
                          ? "Free"
                          : `${plan.price.toLocaleString("vi-VN")} ₫`}
                      </span>
                      {!isFree && (
                        <span className="text-gray-500 text-base">
                          /{plan.duration.toLowerCase()}
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="px-6">
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-4">
                      {isCurrentPlan ? (
                        <Button className="w-full" disabled>
                          Current Plan
                        </Button>
                      ) : isFree ? (
                        <Button
                          className="w-full"
                          variant="outline"
                          onClick={() => handleUpgrade(plan)}
                        >
                          Switch to Free
                        </Button>
                      ) : (
                        <PaymentButton
                          amount={plan.price}
                          description={`${plan.name} Plan - 1 Month Subscription`}
                          className="w-full"
                          onSuccess={(orderCode) => {
                            console.log(
                              "Subscription payment created:",
                              orderCode
                            );
                            // Refresh subscription data
                            fetchSubscriptionData();
                          }}
                          onError={(error) => {
                            console.error("Subscription payment error:", error);
                            setUpgrading(null);
                          }}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Benefits Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Comparison</CardTitle>
            <CardDescription>
              Compare features across all our subscription plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-4 px-2">Feature</th>
                    <th className="text-center py-4 px-2">Free</th>
                    <th className="text-center py-4 px-2">Premium</th>
                    <th className="text-center py-4 px-2">Premium Plus</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-4 px-2">Song Uploads</td>
                    <td className="text-center py-4 px-2">10</td>
                    <td className="text-center py-4 px-2">100</td>
                    <td className="text-center py-4 px-2">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-2">Playlist Creation</td>
                    <td className="text-center py-4 px-2">5</td>
                    <td className="text-center py-4 px-2">50</td>
                    <td className="text-center py-4 px-2">Unlimited</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-2">Max File Size</td>
                    <td className="text-center py-4 px-2">10MB</td>
                    <td className="text-center py-4 px-2">50MB</td>
                    <td className="text-center py-4 px-2">100MB</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-4 px-2">Priority Support</td>
                    <td className="text-center py-4 px-2">❌</td>
                    <td className="text-center py-4 px-2">✅</td>
                    <td className="text-center py-4 px-2">✅</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-2">Early Access</td>
                    <td className="text-center py-4 px-2">❌</td>
                    <td className="text-center py-4 px-2">❌</td>
                    <td className="text-center py-4 px-2">✅</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
