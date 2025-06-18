"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Flag, AlertTriangle } from "lucide-react";

interface FlagReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
  trackArtist?: string;
}

const FlagReportDialog = ({
  isOpen,
  onClose,
  trackId,
  trackTitle,
  trackArtist,
}: FlagReportDialogProps) => {
  const { data: session } = useSession();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!session?.user?.access_token) {
      toast.error("You must be logged in to report content");
      return;
    }

    if (!reason) {
      toast.error("Please select a reason for the report");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/songs/${trackId}/report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: JSON.stringify({
            reason,
            description: description.trim() || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit report");
      }

      toast.success(
        "Report submitted successfully. Thank you for helping keep our community safe."
      );

      // Reset form and close dialog
      setReason("");
      setDescription("");
      onClose();
    } catch (error: any) {
      console.error("Error submitting flag report:", error);

      if (error.message.includes("already reported")) {
        toast.error("You have already reported this track");
      } else {
        toast.error(
          error.message || "Failed to submit report. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReason("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-red-500" />
            Report Track
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting inappropriate content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Track Info */}
          <div className="bg-muted/50 p-3 rounded-md">
            <h4 className="font-medium text-sm">{trackTitle}</h4>
            {trackArtist && (
              <p className="text-xs text-muted-foreground">by {trackArtist}</p>
            )}
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reporting *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INAPPROPRIATE_CONTENT">
                  Inappropriate Content
                </SelectItem>
                <SelectItem value="COPYRIGHT_INFRINGEMENT">
                  Copyright Infringement
                </SelectItem>
                <SelectItem value="SPAM">Spam or Repetitive Content</SelectItem>
                <SelectItem value="HARASSMENT">
                  Harassment or Hate Speech
                </SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Please provide any additional context about why you're reporting this track..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 characters
            </p>
          </div>

          {/* Warning Notice */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">Important:</p>
              <p>
                False reports may result in account restrictions. Please only
                report content that violates our community guidelines.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Flag className="h-4 w-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FlagReportDialog;
