"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { sendRequest } from "@/utils/api";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { Mail, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

const VerifyPage = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [code, setCode] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsVerifying(true);

    try {
      const res = await sendRequest<IBackendRes<undefined>>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/auth/verify`,
        method: "PUT",
        body: {
          _id: params?.id,
          code: code,
        },
      });
      if (res.statusCode === 200) {
        toast.success("Account verified successfully!");
        router.push("/login");
      } else {
        toast.error(res.message || "Verification failed. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);

    try {
      const res = await sendRequest<IBackendRes<undefined>>({
        url: `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verify`,
        method: "PUT",
        body: {
          _id: params?.id,
        },
      });
      if (res.statusCode === 200) {
        toast.success("New verification code sent to your email!");
        setCode(""); // Clear the current code
      } else {
        toast.error(res.message || "Failed to resend code. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo/Brand Section */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Verify Your Email</h1>
          <p className="text-muted-foreground">
            We sent a verification code to your email address
          </p>
        </div>

        {/* Verification Card */}
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              <Mail className="w-6 h-6" />
              Enter Verification Code
            </CardTitle>
            <CardDescription className="text-center">
              Please check your email and enter the 6-digit code below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Verification Code Field */}
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm font-medium">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  name="code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center text-lg tracking-widest"
                  maxLength={6}
                  required
                  disabled={isVerifying}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isVerifying || code.length !== 6}
                size="lg"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Verify Account
                  </>
                )}
              </Button>
            </form>

            {/* Resend Section */}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Didn't receive the code?
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                type="button"
                onClick={handleResend}
                className="w-full"
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend Code
                  </>
                )}
              </Button>
            </div>

            {/* Back to Login */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:underline font-medium"
                >
                  Back to Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground space-y-2">
          <p>© 2025 Music Streaming Platform. All rights reserved.</p>
          <div className="flex justify-center space-x-4">
            <Link href="/terms" className="hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-primary">
              Privacy
            </Link>
            <Link href="/help" className="hover:text-primary">
              Help
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;
