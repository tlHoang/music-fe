"use client";

import React, { useState, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { GripVertical, Menu } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import TrackCard from "@/components/user/track-card.component";
import { Button } from "@/components/ui/button";

const ItemType = "SONG";

interface PlaylistTrack {
  _id: string;
  title: string;
  artist?: string;
  coverImage?: string;
  audioUrl: string;
  duration: number;
  uploadDate?: string;
  visibility?: string;
}

interface DraggableTrackProps {
  track: PlaylistTrack;
  index: number;
  moveTrack: (dragIndex: number, hoverIndex: number) => void;
  onMainClick: () => void;
  isEditing: boolean;
}

const DraggableTrack = ({
  track,
  index,
  moveTrack,
  onMainClick,
  isEditing,
}: DraggableTrackProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id: track._id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { id: string; index: number }, monitor) => {
      if (!isEditing) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      moveTrack(dragIndex, hoverIndex);
      // Update the dragged item's index
      item.index = hoverIndex;
    },
  });

  // Combine drag and drop refs using React DnD's recommended approach
  const attachRef = (el: HTMLLIElement | null) => {
    if (!isEditing || !el) return;

    // Apply the drag and drop refs
    drag(el);
    drop(el);
  };

  return (
    <li
      ref={attachRef}
      className={`group hover:bg-gray-50 dark:hover:bg-gray-800 ${
        isDragging ? "opacity-50" : "opacity-100"
      } transition-opacity duration-200`}
    >
      <div className="flex items-center">
        {isEditing && (
          <div className="flex items-center justify-center w-10 cursor-move">
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <div className={isEditing ? "flex-1" : "w-full"}>
          <TrackCard
            track={track}
            isCompact={true}
            index={index}
            onMainClick={onMainClick}
          />
        </div>
      </div>
    </li>
  );
};

interface SortableTrackListProps {
  tracks: PlaylistTrack[];
  playlistId: string;
  isOwner: boolean;
  onTrackClick: (index: number) => void;
  getFullAudioUrl: (url: string) => string;
}

const SortableTrackList = ({
  tracks,
  playlistId,
  isOwner,
  onTrackClick,
  getFullAudioUrl,
}: SortableTrackListProps) => {
  const [items, setItems] = useState(tracks);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { data: session } = useSession();

  // Update items when tracks prop changes
  useEffect(() => {
    setItems(tracks);
  }, [tracks]);

  const moveTrack = (dragIndex: number, hoverIndex: number) => {
    const draggedItem = items[dragIndex];
    const newItems = [...items];

    // Remove the dragged item
    newItems.splice(dragIndex, 1);
    // Insert it at the hover position
    newItems.splice(hoverIndex, 0, draggedItem);

    setItems(newItems);
  };
  const saveNewOrder = async () => {
    setIsSaving(true);
    try {
      if (!session?.user?.access_token) {
        toast.error("You need to be logged in to perform this action");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/playlists/${playlistId}/reorder`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.user.access_token}`,
          },
          body: JSON.stringify({
            songIds: items.map((track) => track._id),
          }),
        }
      );
      const result = await response.json();

      // Handle different possible response structures
      if (
        result.success || // Direct success property
        (result.data && result.data.success) || // Nested success property
        result.statusCode === 200 // Status code indicates success
      ) {
        toast.success("Playlist order updated successfully");
        setIsEditing(false);
      } else {
        const errorMessage =
          result.message ||
          (result.data && result.data.message) ||
          "Failed to update playlist order";
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("Error saving new track order:", error);
      toast.error("An error occurred while saving the new track order");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEditing = () => {
    // Reset to original order
    setItems(tracks);
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
      {isOwner && (
        <div className="flex justify-end p-3 border-b border-gray-200 dark:border-gray-700">
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1"
            >
              <Menu className="h-4 w-4 mr-1" />
              Reorder Songs
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEditing}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={saveNewOrder}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Order"}
              </Button>
            </div>
          )}
        </div>
      )}

      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {items.map((track, index) => (
          <DraggableTrack
            key={track._id}
            track={track}
            index={index}
            moveTrack={moveTrack}
            isEditing={isEditing}
            onMainClick={() => {
              if (!isEditing) {
                onTrackClick(index);
              }
            }}
          />
        ))}
      </ul>
    </div>
  );
};

export default function DraggablePlaylistTracks({
  tracks,
  playlistId,
  isOwner,
  onTrackClick,
  getFullAudioUrl,
}: SortableTrackListProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <SortableTrackList
        tracks={tracks}
        playlistId={playlistId}
        isOwner={isOwner}
        onTrackClick={onTrackClick}
        getFullAudioUrl={getFullAudioUrl}
      />
    </DndProvider>
  );
}
