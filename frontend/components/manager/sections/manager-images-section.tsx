"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ImageIcon,
  Loader2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { propertyImageApi } from "@/lib/api/property-image-api";
import { getApiErrorMessage } from "@/lib/api/api-error";
import { queryKeys } from "@/lib/query-keys";

export function ManagerImagesSection({
  propertyId,
}: {
  propertyId: string;
}) {
  const client = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const query = useQuery({
    queryKey: queryKeys.propertyImages.byProperty(propertyId),
    queryFn: () => propertyImageApi.list(propertyId),
  });

  const upload = useMutation({
    mutationFn: (files: File[]) => propertyImageApi.upload(propertyId, files),
    onSuccess: () => {
      toast.success("Images uploaded");
      void client.invalidateQueries({
        queryKey: queryKeys.propertyImages.byProperty(propertyId),
      });
      setUploading(false);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
      setUploading(false);
    },
  });

  const remove = useMutation({
    mutationFn: (imageId: string) =>
      propertyImageApi.remove(propertyId, imageId),
    onSuccess: () => {
      toast.success("Image removed");
      void client.invalidateQueries({
        queryKey: queryKeys.propertyImages.byProperty(propertyId),
      });
      setDeletingId(null);
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err));
      setDeletingId(null);
    },
  });

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    upload.mutate(Array.from(files));
  }

  if (query.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" />
        Loading images…
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="text-sm text-red-700">{getApiErrorMessage(query.error)}</p>
    );
  }

  const images = query.data ?? [];

  return (
    <div className="space-y-4">
      {/* Upload */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploading ? "Uploading…" : "Upload images"}
        </Button>
        <p className="mt-1 text-xs text-slate-400">
          JPEG, PNG, or WebP. Multiple files supported.
        </p>
      </div>

      {/* Image grid */}
      {images.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
          <ImageIcon className="size-8 text-slate-300" />
          <p className="text-sm text-slate-500">No images yet.</p>
          <p className="text-xs text-slate-400">
            Upload images to showcase this Property.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <div key={image.id} className="group relative rounded-lg overflow-hidden border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt="Property image"
                className="aspect-square w-full object-cover"
              />
              {image.isCover && (
                <div className="absolute left-2 top-2 flex items-center gap-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  <Star className="size-2.5" />
                  Cover
                </div>
              )}
              <button
                className="absolute right-2 top-2 rounded-md bg-white/90 p-1.5 opacity-0 shadow transition-opacity group-hover:opacity-100 hover:bg-red-50"
                onClick={() => setDeletingId(image.id)}
                aria-label="Delete image"
              >
                <Trash2 className="size-3.5 text-red-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => { if (!open) setDeletingId(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this image?</AlertDialogTitle>
            <AlertDialogDescription>
              This image will be permanently removed from the Property. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deletingId && remove.mutate(deletingId)}
            >
              {remove.isPending && <Loader2 className="size-4 animate-spin" />}
              Remove image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
