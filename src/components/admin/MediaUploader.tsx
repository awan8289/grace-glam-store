'use client';

import Image from 'next/image';
import { useId, useRef, useState } from 'react';
import { ProductVideo } from '@/types';
import { formatBytes } from '@/lib/format';

interface UploadedAsset {
  url: string;
  filename: string;
  type: string;
  size: number;
  kind: 'image' | 'video';
}

async function upload(files: File[]): Promise<UploadedAsset[]> {
  const body = new FormData();
  for (const file of files) body.append('files', file);

  const response = await fetch('/api/upload', { method: 'POST', body });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? 'Upload failed.');
  return payload.files as UploadedAsset[];
}

// ---------------------------------------------------------------------------
// Image gallery
// ---------------------------------------------------------------------------

export function ImageUploader({
  images,
  onChange,
  label = 'Images',
  compact = false,
}: {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
  compact?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const uploaded = await upload(Array.from(fileList));
      onChange([...images, ...uploaded.map((asset) => asset.url)]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const tile = compact ? 'h-16 w-16' : 'h-24 w-24';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={inputId} className="text-[13px] font-medium">
          {label}
        </label>
        <span className="text-[12px] text-[#8a8a93]">
          {images.length > 0 ? `${images.length} · first is the cover` : 'JPG, PNG, WebP or AVIF'}
        </span>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        {images.map((src, index) => (
          <div
            key={`${src}-${index}`}
            className={`group relative ${tile} overflow-hidden rounded-md border border-[#e2e2df] bg-[#f7f7f6]`}
          >
            <Image src={src} alt="" fill sizes="96px" className="object-contain" />

            {index === 0 && !compact && (
              <span className="absolute left-1 top-1 rounded bg-[#16161a]/80 px-1 text-[9px] font-medium text-white">
                Cover
              </span>
            )}

            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-[#16161a]/75 px-1 py-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(index, index - 1)}
                disabled={index === 0}
                aria-label="Move image earlier"
                className="px-1 text-[11px] text-white disabled:opacity-30"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => onChange(images.filter((_, i) => i !== index))}
                aria-label="Remove image"
                className="px-1 text-[11px] text-white"
              >
                ✕
              </button>
              <button
                type="button"
                onClick={() => move(index, index + 1)}
                disabled={index === images.length - 1}
                aria-label="Move image later"
                className="px-1 text-[11px] text-white disabled:opacity-30"
              >
                →
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={`${tile} flex flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[#d5d5d1] bg-white text-[11px] text-[#8a8a93] transition-colors hover:border-[#16161a] hover:text-[#16161a] disabled:opacity-50`}
        >
          {busy ? 'Uploading…' : '+ Add'}
        </button>
      </div>

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple
        onChange={(event) => handleFiles(event.target.files)}
        className="sr-only"
      />

      {error && (
        <p role="alert" className="mt-2 text-[12px] text-[#a4272a]">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product video
// ---------------------------------------------------------------------------

export function VideoUploader({
  video,
  onChange,
}: {
  video: ProductVideo | null;
  onChange: (video: ProductVideo | null) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const [asset] = await upload([file]);
      if (asset.kind !== 'video') throw new Error('That file is not a video.');
      onChange({
        url: asset.url,
        filename: asset.filename,
        type: asset.type,
        size: asset.size,
        uploadedAt: new Date().toISOString(),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor={inputId} className="text-[13px] font-medium">
          Product video
        </label>
        <span className="text-[12px] text-[#8a8a93]">MP4, WebM or MOV · up to 100 MB</span>
      </div>

      {video ? (
        <div className="rounded-md border border-[#e2e2df] bg-white p-3">
          <video
            src={video.url}
            controls
            preload="metadata"
            playsInline
            className="mb-3 aspect-video w-full max-w-md rounded bg-black"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium">{video.filename}</p>
              <p className="text-[12px] text-[#8a8a93]">
                {video.type} · {formatBytes(video.size)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="text-[12px] text-[#6b6b73] hover:text-[#16161a] disabled:opacity-50"
              >
                {busy ? 'Uploading…' : 'Replace'}
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="text-[12px] text-[#6b6b73] hover:text-[#a4272a]"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-24 w-full max-w-md flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[#d5d5d1] bg-white text-[13px] text-[#8a8a93] transition-colors hover:border-[#16161a] hover:text-[#16161a] disabled:opacity-50"
        >
          {busy ? (
            'Uploading…'
          ) : (
            <>
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.4}>
                <rect x="2.5" y="4.5" width="15" height="11" rx="2" />
                <path d="M8.4 8.2v3.6l3.2-1.8z" fill="currentColor" stroke="none" />
              </svg>
              Upload a video
            </>
          )}
        </button>
      )}

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
        onChange={(event) => handleFiles(event.target.files)}
        className="sr-only"
      />

      {error && (
        <p role="alert" className="mt-2 text-[12px] text-[#a4272a]">
          {error}
        </p>
      )}
    </div>
  );
}
