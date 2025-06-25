"use client";

import { useState } from "react";
import { PaymentButton } from "@/components/PaymentButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function PaymentTestPage() {
  const [amount, setAmount] = useState(50000);
  const [description, setDescription] = useState("Test Payment");
  const [buyerName, setBuyerName] = useState("John Doe");
  const [buyerEmail, setBuyerEmail] = useState("john@example.com");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handlePaymentSuccess = (orderCode: number) => {
    setMessage({
      type: "success",
      text: `Payment link created successfully! Order Code: ${orderCode}`,
    });
  };

  const handlePaymentError = (error: string) => {
    setMessage({
      type: "error",
      text: `Payment failed: ${error}`,
    });
  };

  const presetAmounts = [
    { label: "50k VND", value: 50000 },
    { label: "100k VND", value: 100000 },
    { label: "200k VND", value: 200000 },
    { label: "500k VND", value: 500000 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            PayOS Payment Test
          </h1>
          <p className="text-gray-600">
            Test the PayOS integration with custom payment parameters
          </p>
          <div className="mt-2 text-sm text-amber-600">
            ⚠️ Note: This endpoint is now public for testing. No authentication
            required.
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Payment Configuration</CardTitle>
            <CardDescription>
              Configure the payment details and create a PayOS payment link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Amount Section */}
            <div className="space-y-4">
              <Label htmlFor="amount">Amount (VND)</Label>
              <div className="flex gap-2 flex-wrap">
                {presetAmounts.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={amount === preset.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAmount(preset.value)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                placeholder="Enter custom amount"
                min="1000"
                max="50000000"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter payment description"
                rows={3}
              />
            </div>

            {/* Buyer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buyerName">Buyer Name</Label>
                <Input
                  id="buyerName"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Enter buyer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buyerEmail">Buyer Email</Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="Enter buyer email"
                />
              </div>
            </div>

            {/* Payment Preview */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Payment Preview:</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Amount:</strong> {amount.toLocaleString("vi-VN")} VND
                </p>
                <p>
                  <strong>Description:</strong> {description}
                </p>
                <p>
                  <strong>Buyer:</strong> {buyerName} ({buyerEmail})
                </p>
              </div>
            </div>

            {/* Payment Button */}
            <PaymentButton
              amount={amount}
              description={description}
              buyerName={buyerName}
              buyerEmail={buyerEmail}
              className="w-full"
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">How to Test:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>1. Configure your payment details above</li>
                <li>
                  2. Click the "Pay" button to create a PayOS payment link
                </li>
                <li>
                  3. Complete the payment on PayOS (use test cards if in
                  sandbox)
                </li>
                <li>4. You'll be redirected back to the success/cancel page</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Buttons */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.open("/pricing", "_blank")}
          >
            View Pricing Page
          </Button>
        </div>
      </div>
    </div>
  );
}
