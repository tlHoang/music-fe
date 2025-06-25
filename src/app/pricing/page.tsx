"use client";

import { useState, useEffect, useCallback } from "react";
import { PaymentButton } from "@/components/PaymentButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Music, Star, Crown, Upload } from "lucide-react";
import { useSession } from "next-auth/react";
import { sendRequest } from "@/utils/api";

const plans = [
  {
    id: "FREE",
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      "Upload up to 10 songs",
      "Create up to 5 playlists",
      "Max file size: 10MB",
    ],
    icon: Music,
    popular: false,
    limits: {
      songs: 10,
      playlists: 5,
      fileSize: "10MB",
    },
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: 10000,
    description: "For serious music creators",
    features: [
      "Upload up to 100 songs",
      "Create up to 50 playlists",
      "Max file size: 50MB",
    ],
    icon: Star,
    popular: true,
    limits: {
      songs: 100,
      playlists: 50,
      fileSize: "50MB",
    },
  },
  {
    id: "PREMIUM_PLUS",
    name: "Premium Plus",
    price: 25000,
    description: "For professional musicians",
    features: [
      "Unlimited song uploads",
      "Unlimited playlists",
      "Max file size: 100MB",
    ],
    icon: Crown,
    popular: false,
    limits: {
      songs: "Unlimited",
      playlists: "Unlimited",
      fileSize: "100MB",
    },
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  const fetchCurrentSubscription = useCallback(async () => {
    try {
      const response = await sendRequest<any>({
        url: "http://localhost:8888/subscriptions/stats",
        method: "GET",
        headers: session?.user?.access_token
          ? { Authorization: `Bearer ${session.user.access_token}` }
          : {},
      });

      if (response.data) {
        setCurrentPlan(response.data.subscription?.plan || "FREE");
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  }, [session]);

  useEffect(() => {
    // Fetch current subscription status
    fetchCurrentSubscription();
  }, [fetchCurrentSubscription]);
  const handlePaymentSuccess = (planId: string, orderCode: number) => {
    console.log(`Payment successful for ${planId}:`, orderCode);
    // Refresh current subscription
    fetchCurrentSubscription();
  };

  const handlePaymentError = (planId: string, error: string) => {
    console.error(`Payment error for ${planId}:`, error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {" "}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          {/* User Premium Status Badge */}
          {currentPlan && (
            <Badge
              className={`text-lg px-4 py-2 mb-4 mx-auto block ${
                currentPlan === "PREMIUM"
                  ? "bg-yellow-400 text-white"
                  : currentPlan === "PREMIUM_PLUS"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-800"
              }`}
            >
              {currentPlan === "PREMIUM"
                ? "Premium User"
                : currentPlan === "PREMIUM_PLUS"
                  ? "Premium Plus User"
                  : "Free User"}
            </Badge>
          )}
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your music uploads. Get more storage
            space and higher upload limits.
          </p>
        </div>
        {/* Current Plan Notice */}
        {currentPlan && (
          <div className="text-center mb-8">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Current Plan: {currentPlan.replace("_", " ")}
            </Badge>
          </div>
        )}{" "}
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular
                    ? "border-2 border-purple-500 shadow-lg scale-105"
                    : "border border-gray-200"
                } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500">
                    Most Popular
                  </Badge>
                )}
                {isCurrentPlan && (
                  <Badge className="absolute -top-3 right-4 bg-green-500">
                    Current Plan
                  </Badge>
                )}
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price === 0
                        ? "Free"
                        : `${plan.price.toLocaleString("vi-VN")} ₫`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-500 text-base">/month</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-6">
                  {/* Limits Overview */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Upload className="w-4 h-4 mr-2" />
                      Plan Limits
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Songs:</span>
                        <span className="font-medium">{plan.limits.songs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Playlists:</span>
                        <span className="font-medium">
                          {plan.limits.playlists}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>File Size:</span>
                        <span className="font-medium">
                          {plan.limits.fileSize}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>{" "}
                <CardFooter className="px-6 pt-4">
                  {isCurrentPlan ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.price === 0 ? (
                    <Button className="w-full" disabled variant="outline">
                      Free Plan
                    </Button>
                  ) : (
                    <PaymentButton
                      amount={plan.price}
                      description={`Upgrade to ${plan.name}`}
                      buyerName={session?.user?.name || undefined}
                      buyerEmail={session?.user?.email || undefined}
                      planId={plan.id} // Pass planId for subscription
                      durationMonths={1}
                      className="w-full"
                      onSuccess={(orderCode) =>
                        handlePaymentSuccess(plan.id, orderCode)
                      }
                      onError={(error) => handlePaymentError(plan.id, error)}
                    />
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
        {/* Features Comparison */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Plan Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4">Feature</th>
                  <th className="text-center py-4">Free</th>
                  <th className="text-center py-4">Premium</th>
                  <th className="text-center py-4">Premium Plus</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4">Song uploads</td>
                  <td className="text-center">10</td>
                  <td className="text-center">100</td>
                  <td className="text-center">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4">Playlist creation</td>
                  <td className="text-center">5</td>
                  <td className="text-center">50</td>
                  <td className="text-center">Unlimited</td>
                </tr>{" "}
                <tr>
                  <td className="py-4">Max file size</td>
                  <td className="text-center">10MB</td>
                  <td className="text-center">50MB</td>
                  <td className="text-center">100MB</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
