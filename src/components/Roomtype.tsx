import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";


interface MediaFile {
  file: File;
  preview: string;
  type: "image" | "video";
  room: string;
}

interface RoomTypeInputProps {
  propertyId: string;
}

export default function RoomTypeInput({ propertyId }: RoomTypeInputProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  useEffect(() => {
    fetchPropertyMedia();
  }, [propertyId]);

  const fetchPropertyMedia = async () => {
    try {
      const { data, error } = await supabase
        .from("property_media")
        .select("*")
        .eq("property_id", propertyId);

      if (error) throw error;

      setMediaFiles(
        data.map((file: any) => ({
          file: file.file,
          preview: file.preview_url,
          type: file.type,
          room: file.room || "",
        }))
      );
    } catch (error) {
      console.error("Error fetching property media:", error);
    }
  };

  const updateRoomType = async (index: number, room: string) => {
    const updatedMedia = [...mediaFiles];
    updatedMedia[index].room = room;
    setMediaFiles(updatedMedia);

    try {
      const { error } = await supabase
        .from("property_media")
        .update({ room })
        .eq("property_id", propertyId)
        .eq("file", updatedMedia[index].file);

      if (error) throw error;

      console.log("Room type updated successfully");
    } catch (error) {
      console.error("Error updating room type:", error);
    }
  };

  const removeMedia = (index: number) => {
    const updatedMedia = mediaFiles.filter((_, i) => i !== index);
    setMediaFiles(updatedMedia);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Manage Property Media</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mediaFiles.map((file, index) => (
          <div key={index} className="relative group">
            {file.type === "image" ? (
              <img
                src={file.preview}
                alt={`Preview ${index}`}
                className="h-24 w-full object-cover rounded-lg border"
              />
            ) : (
              <video
                src={file.preview}
                className="h-24 w-full object-cover rounded-lg border"
                controls
              />
            )}
            <button
              type="button"
              onClick={() => removeMedia(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
            <select
              value={file.room}
              onChange={(e) => updateRoomType(index, e.target.value)}
              className="mt-1 block w-full text-sm border rounded"
            >
              <option value="">Select Room</option>
              <option value="bedroom">Bedroom</option>
              <option value="living room">Living Room</option>
              <option value="bathroom">Bathroom</option>
              <option value="kitchen">Kitchen</option>
              <option value="floorplan">Floorplan</option>
              <option value="other">Other</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
