import { NextRequest } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { isAuthenticated, unauthorized } from '@/lib/auth';
import { slugify } from '@/lib/format';

export const dynamic = 'force-dynamic';

/**
 * Uploaded media is written under `public/uploads`.
 *
 * This requires a host with a persistent, writable disk. On a platform with an
 * ephemeral filesystem the write appears to succeed and the file is gone on the
 * next deploy — see README for the storage note.
 */
const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

const VIDEO_TYPES: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-m4v': 'm4v',
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
const MAX_FILES_PER_REQUEST = 12;

/**
 * Magic-byte signatures. The `Content-Type` on a multipart part is supplied by
 * the client and can claim anything, so the declared type is verified against
 * the actual bytes before anything is stored.
 */
const SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  'image/gif': (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
  // RIFF....WEBP
  'image/webp': (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  // ....ftyp — ISO base media (avif, mp4, mov, m4v)
  'image/avif': isIsoBmff,
  'video/mp4': isIsoBmff,
  'video/quicktime': isIsoBmff,
  'video/x-m4v': isIsoBmff,
  // EBML header
  'video/webm': (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
};

function isIsoBmff(b: Uint8Array): boolean {
  return b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70;
}

function matchesSignature(declaredType: string, bytes: Uint8Array): boolean {
  const check = SIGNATURES[declaredType];
  return check ? check(bytes) : false;
}

interface UploadedAsset {
  url: string;
  filename: string;
  type: string;
  size: number;
  kind: 'image' | 'video';
}

/**
 * Accepts multipart form data under the field `files` (repeatable) and returns
 * the public URLs. Admin-only.
 */
export async function POST(request: NextRequest) {
  // Checked here as well as in the proxy: an endpoint that writes files to the
  // public web root must never depend on one layer alone.
  if (!(await isAuthenticated())) return unauthorized();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Expected multipart form data.' }, { status: 400 });
  }

  const files = form.getAll('files').filter((entry): entry is File => entry instanceof File);
  if (files.length === 0) {
    return Response.json({ error: 'No files were uploaded.' }, { status: 400 });
  }

  if (files.length > MAX_FILES_PER_REQUEST) {
    return Response.json(
      { error: `Upload at most ${MAX_FILES_PER_REQUEST} files at a time.` },
      { status: 413 }
    );
  }

  const uploaded: UploadedAsset[] = [];

  for (const file of files) {
    const isImage = file.type in IMAGE_TYPES;
    const isVideo = file.type in VIDEO_TYPES;

    if (!isImage && !isVideo) {
      return Response.json(
        { error: `Unsupported file type "${file.type || 'unknown'}" for ${file.name}.` },
        { status: 415 }
      );
    }

    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      return Response.json(
        {
          error: `${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${
            limit / 1024 / 1024
          } MB.`,
        },
        { status: 413 }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    // The declared MIME type is attacker-controlled; the bytes are not.
    if (!matchesSignature(file.type, bytes.subarray(0, 16))) {
      return Response.json(
        { error: `${file.name} does not look like a valid ${file.type} file.` },
        { status: 415 }
      );
    }

    const kind: 'image' | 'video' = isVideo ? 'video' : 'image';
    const extension = isVideo ? VIDEO_TYPES[file.type] : IMAGE_TYPES[file.type];

    // Never trust the client filename for the path — derive a safe one. The
    // extension comes from our own allow-list, never from the upload.
    const stem = slugify(file.name.replace(/\.[^.]+$/, '')) || kind;
    const filename = `${stem}-${randomUUID().slice(0, 8)}.${extension}`;
    const directory = path.join(UPLOAD_ROOT, `${kind}s`);
    const destination = path.join(directory, filename);

    // Belt and braces: refuse anything that would land outside the upload root.
    if (!destination.startsWith(UPLOAD_ROOT + path.sep)) {
      return Response.json({ error: 'Invalid upload path.' }, { status: 400 });
    }

    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(destination, bytes);

    uploaded.push({
      url: `/uploads/${kind}s/${filename}`,
      filename: file.name,
      type: file.type,
      size: file.size,
      kind,
    });
  }

  return Response.json({ files: uploaded }, { status: 201 });
}
