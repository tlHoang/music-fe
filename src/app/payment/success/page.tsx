// app/payment/success/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!searchParams) {
      setLoading(false);
      return;
    }

    const orderCode = searchParams.get("orderCode");
    const status = searchParams.get("status");

    if (orderCode) {
      checkPaymentStatus(orderCode);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const checkPaymentStatus = async (orderCode: string) => {
    try {
      const response = await fetch(
        `http://localhost:8888/payments/info/${orderCode}`
      );
      const result = await response.json();

      if (result.success) {
        setPaymentInfo(result.data);
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking payment status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="text-green-600 text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Payment Successful!
        </h1>

        {paymentInfo && (
          <div className="text-left mb-6 space-y-2">
            <p>
              <strong>Order Code:</strong> {paymentInfo.orderCode}
            </p>
            <p>
              <strong>Amount:</strong>{" "}
              {paymentInfo.amount?.toLocaleString("vi-VN")} VND
            </p>
            <p>
              <strong>Description:</strong> {paymentInfo.description}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <span className="text-green-600">{paymentInfo.status}</span>
            </p>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          Thank you for your payment! Your transaction has been completed
          successfully.
        </p>

        <div className="space-y-3">
          <Link href="/dashboard" className="w-full">
            <Button className="w-full">Go to Dashboard</Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
