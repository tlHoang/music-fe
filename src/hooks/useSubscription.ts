import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { sendRequest } from "@/utils/api";

interface Subscription {
  plan: "FREE" | "PREMIUM" | "PREMIUM_PLUS";
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isPremium: boolean;
  isPremiumPlus: boolean;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchSubscription = useCallback(async () => {
    if (status !== "authenticated" || !session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await sendRequest<{ subscription: Subscription }>({
        url: "http://localhost:8888/subscriptions/stats",
        method: "GET",
      });

      setSubscription(data.subscription);
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isPremium =
    subscription?.plan === "PREMIUM" || subscription?.plan === "PREMIUM_PLUS";
  const isPremiumPlus = subscription?.plan === "PREMIUM_PLUS";

  return {
    subscription,
    isPremium,
    isPremiumPlus,
    loading,
    error,
    refetch: fetchSubscription,
  };
}
