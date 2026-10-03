import { NextRequest } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { clientIp, createRateLimiter, tooManyAttempts } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * Public upload for the photo a shopper wants turned into custom artwork.
 *
 * `/api/upload` is admin-only (the proxy returns 401 to everyone else), so the
 * storefront cannot use it. This endpoint is deliberately narrower:
 *   - one image per request, JPEG / PNG / WEBP only, verified by magic bytes
 *   - 10 MB cap (the product page downsizes larger photos before sending)
 *   - throttled per IP and with a global ceiling, like account registration
 *   - same-origin only
 *
 * Storage: when FIREBASE_STORAGE_BUCKET is set, the file goes to Firebase
 * Storage and survives redeploys. Otherwise it is written to
 * public/uploads/customer-photos, which is fine locally but is wiped whenever
 * the host rebuilds the container — set the bucket before taking real orders.
 */

const MAX_BYTES = 10 * 1024 * 1024;

const TYPES: Record<string, { ext: string; check: (b: Uint8Array) => boolean }> = {
  'image/jpeg': { ext: 'jpg', check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': {
    ext: 'png',
    check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  'image/webp': {
    ext: 'webp',
    check: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
};

const perIp = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 30 });
const ceiling = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 600 });

const LOCAL_ROOT = path.join(process.cwd(), 'public', 'uploads', 'customer-photos');

async function storeInFirebase(bucketName: string, objectPath: string, bytes: Buffer, contentType: string) {
  const { getStorage, getDownloadURL } = await import('firebase-admin/storage');
  const { getFirebaseApp } = await import('@/lib/firebase-admin');
  const file = getStorage(getFirebaseApp()).bucket(bucketName).file(objectPath);
  await file.save(bytes, { contentType, resumable: false });
  return getDownloadURL(file);
}

async function storeLocally(filename: string, bytes: Buffer) {
  await fs.mkdir(LOCAL_ROOT, { recursive: true });
  const destination = path.join(LOCAL_ROOT, filename);
  if (!destination.startsWith(LOCAL_ROOT + path.sep)) throw new Error('Invalid upload path.');
  await fs.writeFile(destination, bytes);
  return `/uploads/customer-photos/${filename}`;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== request.headers.get('host')) {
    return Response.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
  }

  const overall = ceiling.check('all');
  if (!overall.allowed) return tooManyAttempts(overall.retryAfter);
  const mine = perIp.check(clientIp(request));
  if (!mine.allowed) return tooManyAttempts(mine.retryAfter);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'Expected multipart form data.' }, { status: 400 });
  }

  const file = form.get('photo');
  if (!(file instanceof File)) {
    return Response.json({ error: 'No photo was uploaded.' }, { status: 400 });
  }

  const type = TYPES[file.type];
  if (!type) {
    return Response.json({ error: 'Please upload a JPG, PNG or WEBP photo.' }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'That photo is larger than 10 MB.' }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!type.check(bytes.subarray(0, 16))) {
    return Response.json({ error: 'That file does not look like a valid image.' }, { status: 415 });
  }

  const filename = `${new Date().toISOString().slice(0, 10)}-${randomUUID()}.${type.ext}`;

  try {
    const bucket = process.env.FIREBASE_STORAGE_BUCKET;
    const url = bucket
      ? await storeInFirebase(bucket, `customer-photos/${filename}`, bytes, file.type)
      : await storeLocally(filename, bytes);
    return Response.json({ url }, { status: 201 });
  } catch (error) {
    console.error('Customer photo upload failed:', error);
    return Response.json({ error: 'Could not save your photo. Please try again.' }, { status: 500 });
  }
}
