"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  FileText,
  ImageIcon,
  Loader2,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parkingRightsApi } from "@/lib/api/parking-rights-api";

export interface DocumentViewerTarget {
  id: string;
  originalName: string;
  mimeType?: string;
  sizeBytes?: number;
  category?: string;
  url?: string;
}

export interface DocumentViewerModalProps {
  document: DocumentViewerTarget | null;
  isOpen: boolean;
  onClose: () => void;
  onFetchUrl?: (documentId: string) => Promise<string>;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function DocumentViewerModal({
  document,
  isOpen,
  onClose,
  onFetchUrl,
}: DocumentViewerModalProps) {
  return (
    <Dialog
      open={isOpen && Boolean(document)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] max-w-5xl sm:max-w-5xl h-[88vh] max-h-[920px] p-0 gap-0 overflow-hidden flex flex-col bg-white border border-slate-200 shadow-2xl rounded-xl"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>
            {document?.originalName ?? "Document viewer"}
          </DialogTitle>
          <DialogDescription>
            Preview and verify parking right claim evidence document.
          </DialogDescription>
        </DialogHeader>

        {isOpen && document && (
          <DocumentViewerBody
            document={document}
            onClose={onClose}
            onFetchUrl={onFetchUrl}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DocumentViewerBody({
  document,
  onClose,
  onFetchUrl,
}: {
  document: DocumentViewerTarget;
  onClose: () => void;
  onFetchUrl?: (documentId: string) => Promise<string>;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [rawUrl, setRawUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const isPdf = Boolean(
    document.mimeType === "application/pdf" ||
      document.originalName.toLowerCase().endsWith(".pdf")
  );

  const isImage = Boolean(
    document.mimeType?.startsWith("image/") ||
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(document.originalName)
  );

  useEffect(() => {
    let isMounted = true;
    let createdUrl: string | null = null;

    async function loadDocument() {
      try {
        setLoading(true);
        setError(null);
        setZoom(1);

        // 1. Resolve signed URL
        let url = document.url;
        if (!url) {
          if (onFetchUrl) {
            url = await onFetchUrl(document.id);
          } else {
            const result = await parkingRightsApi.documentDownload(document.id);
            url = result.url;
          }
        }

        if (!isMounted) return;
        setRawUrl(url);

        // 2. Fetch binary blob to ensure correct MIME type and render directly
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(
            `Unable to download document (HTTP status: ${response.status})`
          );
        }

        const rawBlob = await response.blob();
        if (!isMounted) return;

        const effectiveType = isPdf
          ? "application/pdf"
          : document.mimeType || rawBlob.type || "application/octet-stream";

        const typedBlob = new Blob([rawBlob], { type: effectiveType });
        createdUrl = URL.createObjectURL(typedBlob);

        if (!isMounted) {
          URL.revokeObjectURL(createdUrl);
          return;
        }

        setBlobUrl(createdUrl);
      } catch (err) {
        if (isMounted) {
          console.error("Document preview error:", err);
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load document preview. You can still download the file."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadDocument();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [document.id, document.url, document.mimeType, document.originalName, isPdf, onFetchUrl]);

  function handleDownload() {
    const targetUrl = blobUrl || rawUrl;
    if (!targetUrl) return;

    const anchor = window.document.createElement("a");
    anchor.href = targetUrl;
    anchor.download = document.originalName;
    window.document.body.appendChild(anchor);
    anchor.click();
    window.document.body.removeChild(anchor);
  }

  function handleOpenNewTab() {
    const targetUrl = blobUrl || rawUrl;
    if (!targetUrl) return;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {/* Modal Toolbar Header */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg border ${
              isPdf
                ? "bg-rose-50 border-rose-100 text-rose-600"
                : isImage
                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                : "bg-slate-100 border-slate-200 text-slate-600"
            }`}
          >
            {isPdf ? (
              <FileText className="size-5" />
            ) : isImage ? (
              <ImageIcon className="size-5" />
            ) : (
              <FileText className="size-5" />
            )}
          </div>

          <div className="min-w-0">
            <h3
              className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[220px] sm:max-w-[420px] md:max-w-[540px]"
              title={document.originalName}
            >
              {document.originalName}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {document.category && (
                <span className="font-semibold text-slate-600 uppercase bg-slate-100 px-1.5 py-0.5 rounded text-[10px] tracking-wide">
                  {document.category.replaceAll("_", " ")}
                </span>
              )}
              <span className="font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] uppercase font-mono">
                {isPdf ? "PDF" : isImage ? "IMAGE" : "DOCUMENT"}
              </span>
              {document.sizeBytes && (
                <span className="text-slate-500 font-medium">
                  {formatBytes(document.sizeBytes)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isImage && blobUrl && (
            <div className="hidden sm:flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                title="Zoom out"
              >
                <ZoomOut className="size-4" />
              </Button>
              <span className="text-[11px] font-mono font-medium text-slate-600 w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                title="Zoom in"
              >
                <ZoomIn className="size-4" />
              </Button>
              {zoom !== 1 && (
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => setZoom(1)}
                  title="Reset zoom"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              )}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenNewTab}
            disabled={!blobUrl && !rawUrl}
            className="gap-1.5 text-xs font-semibold h-8"
            title="Open document in a new browser tab"
          >
            <ExternalLink className="size-3.5" />
            <span className="hidden sm:inline">New tab</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={!blobUrl && !rawUrl}
            className="gap-1.5 text-xs font-semibold h-8"
            title="Download file with original name"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Download</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onClose}
            className="size-8 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            title="Close viewer"
          >
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>

      {/* Modal Content Body */}
      <div className="relative flex-1 w-full overflow-hidden bg-slate-100/80">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90 backdrop-blur-xs p-6 text-center">
            <Loader2 className="size-9 animate-spin text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-slate-800">
                Retrieving secure evidence preview...
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Verifying authenticated access token
              </p>
            </div>
          </div>
        )}

        {error ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center bg-slate-50">
            <div className="flex size-14 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertTriangle className="size-7" />
            </div>
            <div className="max-w-md">
              <h4 className="text-base font-bold text-slate-900">
                Preview Failed
              </h4>
              <p className="mt-1 text-xs text-slate-600">{error}</p>
            </div>
            {rawUrl && (
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  onClick={handleDownload}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Download className="size-4" />
                  Download original file
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenNewTab}
                  className="gap-2"
                >
                  <ExternalLink className="size-4" />
                  Open direct link
                </Button>
              </div>
            )}
          </div>
        ) : isPdf && blobUrl ? (
          <div className="relative w-full h-full bg-slate-200">
            <iframe
              src={`${blobUrl}#toolbar=1&navpanes=0`}
              title={document.originalName}
              className="w-full h-full border-0 bg-white"
            />
          </div>
        ) : isImage && blobUrl ? (
          <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
            <div className="max-w-full max-h-full flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blobUrl}
                alt={document.originalName}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: "transform 0.12s ease-out",
                }}
                className="max-h-[74vh] max-w-full object-contain rounded-lg shadow-md border border-slate-200 bg-white select-none"
              />
            </div>
          </div>
        ) : blobUrl ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center bg-slate-50">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-200 text-slate-700 shadow-inner">
              <FileText className="size-8" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                {document.originalName}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                {document.mimeType || "Binary document"}{" "}
                {document.sizeBytes
                  ? `· ${formatBytes(document.sizeBytes)}`
                  : ""}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Direct in-browser visual preview is not supported for this file
                format.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleDownload}
              size="lg"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 mt-2"
            >
              <Download className="size-4" />
              Download file
            </Button>
          </div>
        ) : null}
      </div>
    </>
  );
}
