// components/PaymentButton.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";

interface PaymentButtonProps {
  amount: number;
  description: string;
  buyerName?: string;
  buyerEmail?: string;
  planId?: string; // Add planId for subscription
  durationMonths?: number;
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  onSuccess?: (orderCode: number) => void;
  onError?: (error: string) => void;
}

export function PaymentButton({
  amount,
  description,
  buyerName,
  buyerEmail,
  planId,
  durationMonths = 1,
  className,
  variant = "default",
  onSuccess,
  onError,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const handlePayment = async () => {
    setLoading(true);
    try {
      let response;
      if (planId) {
        response = await fetch("/api/payments/create-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: planId,
            durationMonths,
            buyerName,
            buyerEmail,
          }),
        });
      } else {
        response = await fetch("/api/payments/create-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            description,
            buyerName,
            buyerEmail,
            returnUrl: `${window.location.origin}/payment/success`,
            cancelUrl: `${window.location.origin}/payment/cancel`,
          }),
        });
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Payment API error response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log("Payment API response:", result);

      // Handle the nested response structure from our API
      // The response has: { statusCode: 200, data: { success: true, data: {...} } }
      const paymentData = result.data;

      if (paymentData && paymentData.success === true) {
        // Open PayOS payment page in a new tab
        const paymentWindow = window.open(
          paymentData.data.checkoutUrl,
          "_blank"
        );

        // Check if popup was blocked
        if (!paymentWindow) {
          throw new Error("Popup blocked. Please allow popups and try again.");
        }

        onSuccess?.(paymentData.data.orderCode);

        // Optional: Monitor the payment window
        const checkClosed = setInterval(() => {
          if (paymentWindow.closed) {
            clearInterval(checkClosed);
            // Payment window was closed, you might want to check payment status
            console.log("Payment window closed");
          }
        }, 1000);
      } else if (result.error) {
        // Handle error response from our API route
        throw new Error(result.error);
      } else {
        // Handle unexpected response format
        console.error("Unexpected response format:", result);
        throw new Error(
          paymentData?.message || result.message || "Payment creation failed"
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      onError?.(errorMessage);
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className={className}
      variant={variant}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating Payment...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Pay {amount.toLocaleString("vi-VN")} ₫
        </>
      )}
    </Button>
  );
}
