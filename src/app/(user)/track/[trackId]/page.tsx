"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { usePlayer } from "@/components/app/player-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Play,
  Pause,
  Heart,
  Share2,
  Download,
  MoreHorizontal,
  Clock,
  Calendar,
  User,
  Music,
  MessageCircle,
  Send,
  Eye,
  HeadphonesIcon,
  Flag,
  FileText,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import LikeButton from "@/components/user/like-button.component";
import FlagReportDialog from "@/components/user/flag-report-dialog";
import AddToPlaylistButton from "@/components/user/playlist/add-to-playlist-button";

interface TrackUser {
  _id: string;
  name?: string;
  username: string;
  profilePicture?: string;
}

interface Track {
  _id: string;
  title: string;
  audioUrl: string;
  visibility: string;
  userId: TrackUser;
  duration: number;
  uploadDate: string;
  playCount?: number;
  genres?: Array<{ _id: string; name: string } | string>; // Support both populated and unpopulated genres
  cover?: string;
  likeCount?: number;
  commentCount?: number;
  description?: string;
  isLiked?: boolean;
  lyrics?: string;
}

interface Comment {
  _id: string;
  content: string;
  userId: {
    _id: string;
    name?: string;
    username: string;
    profilePicture?: string;
  };
  createdAt: string;
}

export default function TrackDetailsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const trackId = params?.trackId as string;
  const [track, setTrack] = useState<Track | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedTracks, setRelatedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [showLyricsModal, setShowLyricsModal] = useState(false);

  const { playTrack, currentTrack, isPlaying, togglePlayPause } = usePlayer();
  useEffect(() => {
    if (trackId) {
      fetchTrackDetails();
      fetchComments();
      fetchRelatedTracks();
    }
  }, [trackId, session?.user?.access_token]); // eslint-disable-line react-hooks/exhaustive-deps
  const fetchTrackDetails = async () => {
    if (!trackId) return;

    try {
      setLoading(true);
      setError(null);

      const headers: HeadersInit = {};
      if (session?.user?.access_token) {
        headers["Authorization"] = `Bearer ${session.user.access_token}`;
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/songs/${trackId}`,
        { headers }
      );

      if (!response.ok) {
        throw new Error("Track not found");
      }

      const result = await response.json();

      if (result.data) {
        let trackData = result.data;
        if (trackData && trackData.data) trackData = trackData.data;
        setTrack(trackData);
      } else {
        throw new Error("Failed to load track details");
      }
    } catch (error: any) {
      console.error("Error fetching track details:", error);
      setError(error.message || "Failed to load track");
    } finally {
      setLoading(false);
    }
  };
  const fetchComments = async () => {
    if (!trackId) return;

    try {
      setCommentsLoading(true);

      const headers: HeadersInit = {};
      if (session?.user?.access_token) {
        headers["Authorization"] = `Bearer ${session.user.access_token}`;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comments/song/${trackId}`,
        { headers }
      );      if (response.ok) {
        const result = await response.json();
        console.log("Comments API response:", result);
        
        // Handle different response structures
        if (Array.isArray(result)) {
          // Direct array response
          setComments(result);
        } else if (result.success && Array.isArray(result.data)) {
          // Wrapped response
          setComments(result.data);
        } else if (result.data && Array.isArray(result.data)) {
          // Response with data property
          setComments(result.data);
        } else {
          // Fallback - treat as empty
          setComments([]);
        }
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchRelatedTracks = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/songs?limit=5`
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          // Filter out the current track and limit to 4 related tracks
          const filtered = result.data
            .filter((t: Track) => t._id !== trackId)
            .slice(0, 4);
          setRelatedTracks(filtered);
        }
      }
    } catch (error) {
      console.error("Error fetching related tracks:", error);
    }
  };

  const handlePlayToggle = () => {
    if (track) {
      if (currentTrack?._id === track._id) {
        togglePlayPause();
      } else {
        playTrack(track);
      }
    }
  };
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trackId) return;

    if (!session?.user?.access_token || !session?.user?._id) {
      toast.error("Please log in to comment");
      return;
    }

    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    try {
      setSubmittingComment(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: JSON.stringify({
            content: newComment.trim(),
            songId: trackId,
            userId: session.user._id,
          }),
        }
      );

      if (response.ok) {
        setNewComment("");
        fetchComments(); // Refresh comments
        toast.success("Comment added successfully");
      } else {
        throw new Error("Failed to add comment");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: track?.title,
        text: `Check out "${track?.title}" by ${track?.userId.name || track?.userId.username}`,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto text-center">
          {" "}
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Track Not Found</h2>
            <p className="mb-4">
              {error ||
                "The track you're looking for doesn't exist, may have been removed, or has been disabled due to content policy violations."}
            </p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isCurrentTrack = currentTrack?._id === track._id;

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Hero Section */}
        <Card className="overflow-hidden">
          <div className="relative">
            {/* Background Image */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20">
              {track.cover && (
                <Image
                  src={track.cover}
                  alt={track.title}
                  fill
                  className="object-cover opacity-30 blur-sm"
                />
              )}
            </div>

            <CardContent className="relative p-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Track Cover */}
                <div className="w-48 h-48 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-lg shadow-lg flex items-center justify-center text-white text-6xl font-bold overflow-hidden flex-shrink-0">
                  {track.cover ? (
                    <Image
                      src={track.cover}
                      alt={track.title}
                      width={192}
                      height={192}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Music size={64} />
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                      {track.title}
                    </h1>
                    <Link
                      href={`/profile/${track.userId._id}`}
                      className="text-xl text-gray-600 dark:text-gray-300 hover:text-purple-600 transition-colors flex items-center gap-2"
                    >
                      <User size={20} />
                      {track.userId.name || track.userId.username}
                    </Link>
                  </div>
                  {/* Track Metadata */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      {formatDuration(track.duration)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      {formatDate(track.uploadDate)}
                    </div>
                    {track.playCount !== undefined && (
                      <div className="flex items-center gap-1">
                        <Eye size={16} />
                        {track.playCount.toLocaleString()} plays
                      </div>
                    )}
                    {track.likeCount !== undefined && (
                      <div className="flex items-center gap-1">
                        <Heart size={16} />
                        {track.likeCount.toLocaleString()} likes
                      </div>
                    )}
                  </div>                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handlePlayToggle}
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isCurrentTrack && isPlaying ? (
                        <Pause className="mr-2" size={20} />
                      ) : (
                        <Play className="mr-2" size={20} />
                      )}
                      {isCurrentTrack && isPlaying ? "Pause" : "Play"}
                    </Button>{" "}
                    {session?.user && (
                      <LikeButton
                        songId={track._id}
                        initialIsLiked={track.isLiked || false}
                        initialLikeCount={track.likeCount || 0}
                        size="lg"
                        song={track}
                      />
                    )}{" "}                    {track.lyrics && (
                      <Button
                        onClick={() => setShowLyricsModal(true)}
                        variant="outline"
                        size="lg"
                      >
                        <FileText className="mr-2" size={20} />
                        View Lyrics
                      </Button>
                    )}
                    {session?.user && (
                      <AddToPlaylistButton
                        trackId={track._id}
                        size="lg"
                      />
                    )}
                    <Button onClick={handleShare} variant="outline" size="lg">
                      <Share2 className="mr-2" size={20} />
                      Share
                    </Button>
                    <Button
                      onClick={() => setShowFlagDialog(true)}
                      variant="outline"
                      size="lg"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Flag className="mr-2" size={20} />
                      Report
                    </Button>
                  </div>{" "}
                  {/* Genres */}
                  {track.genres && track.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {track.genres.map((genre, index) => (
                        <Badge key={index} variant="secondary">
                          {typeof genre === "string" ? genre : genre.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {track.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About this track</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {track.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle size={20} />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Comment Form */}
                {session?.user ? (
                  <form onSubmit={handleCommentSubmit} className="space-y-3">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="w-full sm:w-auto"
                    >
                      {submittingComment ? (
                        <>Posting...</>
                      ) : (
                        <>
                          <Send className="mr-2" size={16} />
                          Post Comment
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      Please log in to leave a comment
                    </p>
                    <Link href="/auth/signin">
                      <Button variant="outline">Sign In</Button>
                    </Link>
                  </div>
                )}
                <Separator /> {/* Comments List */}
                {commentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={`loading-${i}`}
                        className="animate-pulse flex gap-3"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map((comment, commentIndex) => (
                      <div
                        key={`comment-${commentIndex}`}
                        className="flex gap-3"
                      >
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {comment.userId.profilePicture ? (
                            <Image
                              src={comment.userId.profilePicture}
                              alt={
                                comment.userId.name || comment.userId.username
                              }
                              width={40}
                              height={40}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            (comment.userId.name || comment.userId.username)
                              .charAt(0)
                              .toUpperCase()
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/profile/${comment.userId._id}`}
                              className="font-medium text-gray-900 dark:text-white hover:text-purple-600 transition-colors"
                            >
                              {comment.userId.name || comment.userId.username}
                            </Link>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle
                      className="mx-auto mb-3"
                      size={48}
                      opacity={0.5}
                    />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Artist Info */}
            <Card>
              <CardHeader>
                <CardTitle>Artist</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/profile/${track.userId._id}`} className="block">
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                      {track.userId.profilePicture ? (
                        <Image
                          src={track.userId.profilePicture}
                          alt={track.userId.name || track.userId.username}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        (track.userId.name || track.userId.username)
                          .charAt(0)
                          .toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {track.userId.name || track.userId.username}
                      </p>
                      <p className="text-sm text-gray-500">View Profile</p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>{" "}
            {/* Related Tracks */}
            {relatedTracks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Tracks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedTracks.map((relatedTrack, relatedIndex) => (
                    <Link
                      key={`related-${relatedIndex}`}
                      href={`/track/${relatedTrack._id}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-600 rounded flex items-center justify-center text-white text-xs font-medium overflow-hidden">
                          {relatedTrack.cover ? (
                            <Image
                              src={relatedTrack.cover}
                              alt={relatedTrack.title}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music size={20} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                            {relatedTrack.title}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {relatedTrack.userId.name ||
                              relatedTrack.userId.username}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDuration(relatedTrack.duration)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}{" "}
          </div>
        </div>
      </div>

      {/* Flag Report Dialog */}
      {track && (
        <FlagReportDialog          trackId={track._id}
          trackTitle={track.title}
          trackArtist={track.userId.name || track.userId.username}
          isOpen={showFlagDialog}
          onClose={() => setShowFlagDialog(false)}
        />
      )}

      {/* Lyrics Modal */}
      <Dialog open={showLyricsModal} onOpenChange={setShowLyricsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText size={20} />
              Lyrics - {track?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              by {track?.userId.name || track?.userId.username}
            </div>
            <div className="whitespace-pre-line text-gray-800 dark:text-gray-200 leading-relaxed">
              {track?.lyrics || "No lyrics available for this track."}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
