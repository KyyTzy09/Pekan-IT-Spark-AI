"use client";

import { Loader2, Upload } from "lucide-react";
import * as React from "react";
import { cn, getAvatarUrl } from "@/lib/utils";
import {
  getCloudinarySignature,
  updateAvatarAction,
} from "@/server/actions/avatar";

const MAX_FILE_SIZE = 7 * 1024 * 1024; // 7MB

export function AvatarUpload({
  currentImage,
  userName,
}: {
  currentImage: string | null;
  userName: string;
}) {
  const [preview, setPreview] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const displayImage = preview ?? getAvatarUrl(currentImage, userName);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError("Ukuran file maksimal 7MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const sigResult = await getCloudinarySignature();
      if (!sigResult.ok) {
        setError(sigResult.error);
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", sigResult.apiKey);
      formData.append("timestamp", String(sigResult.timestamp));
      formData.append("signature", sigResult.signature);
      formData.append("folder", sigResult.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${sigResult.cloudName}/image/upload`,
        { method: "POST", body: formData },
      );

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "Upload gagal.");
        setUploading(false);
        return;
      }

      setPreview(data.secure_url);

      const updateResult = await updateAvatarAction(data.secure_url);
      if (!updateResult.ok) {
        setError(updateResult.error || "Gagal menyimpan avatar.");
      }
    } catch {
      setError("Terjadi kesalahan saat upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="group relative shrink-0"
      >
        <div
          className={cn(
            "size-24 sm:size-28 rounded-2xl border-2 border-border/40 bg-muted/40 overflow-hidden transition-all",
            uploading && "opacity-60",
          )}
        >
          {/* biome-ignore lint/performance/noImgElement: Using external image URLs */}
          <img
            src={displayImage}
            alt={userName}
            className="size-full object-cover"
          />
        </div>
        <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/0 transition-all group-hover:bg-black/40">
          {!uploading && (
            <Upload
              size={20}
              className="text-white opacity-0 transition-all group-hover:opacity-100"
            />
          )}
        </div>
        {uploading && (
          <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/40">
            <Loader2 size={20} className="text-white animate-spin" />
          </div>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      {error && (
        <p className="text-[11px] text-destructive font-semibold text-center">
          {error}
        </p>
      )}
      <p className="text-[10px] text-muted-foreground">
        Klik foto untuk ganti • Max 7MB
      </p>
    </div>
  );
}
