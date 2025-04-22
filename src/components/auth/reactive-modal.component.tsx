"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendRequest } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface IResendVerify {
  _id: string;
  email: string;
}

interface Props {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function ReactiveModal(props: Props) {
  const { isOpen, setIsOpen } = props;
  const [email, setEmail] = useState<string>("");
  const router = useRouter();
  const handleActiveAccount = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      toast.error("email must be email");
      return;
    }
    const res = await sendRequest<IBackendRes<IResendVerify>>({
      url: `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verify`,
      method: "PUT",
      body: {
        email: email,
      },
    });
    // console.log(res);
    if (res.statusCode === 200) {
      setIsOpen(false);
      router.push(`/verify/${res?.data?._id}`);
    } else {
      toast.error(res.message);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <DialogContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        className="sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>Active your account</DialogTitle>
          <DialogDescription>
            Please enter your email to active your account.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="email" className="sr-only">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button type="button" onClick={handleActiveAccount}>
            Active account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
