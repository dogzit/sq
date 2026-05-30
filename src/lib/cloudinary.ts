import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export async function uploadImage(
  file: string, // base64 data URI or URL
  folder: string = "sidequest/submissions"
) {
  const result = await cloudinary.uploader.upload(file, {
    folder,
    transformation: [
      { width: 1080, height: 1080, crop: "limit" },
      { quality: "auto", fetch_format: "auto" },
    ],
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}

export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}

// ──────────────────────────────────────────────
//  Buffer → upload_stream (image OR video)
// ──────────────────────────────────────────────
export interface MediaUploadResult {
  url: string;
  publicId: string;
  resourceType: "image" | "video" | "raw" | "auto";
  format: string;
  bytes: number;
  duration?: number; // videos only
}

export function uploadMediaStream(
  buffer: Buffer,
  folder: string = "sidequest/submissions",
  resourceType: "image" | "video" | "auto" = "auto"
): Promise<MediaUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        ...(resourceType !== "video"
          ? { transformation: [{ width: 1080, height: 1080, crop: "limit" }, { quality: "auto", fetch_format: "auto" }] }
          : {}),
      },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Cloudinary upload failed"));
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type as "image" | "video" | "raw",
          format: result.format,
          bytes: result.bytes,
          duration: (result as { duration?: number }).duration,
        });
      }
    );
    stream.end(buffer);
  });
}
