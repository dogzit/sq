const IMGBB_API = "https://api.imgbb.com/1/upload";

export async function uploadToImgbb(
  imageData: string // base64 data URI or raw base64
): Promise<{ url: string; deleteUrl: string }> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new Error("IMGBB_API_KEY not configured");

  // Strip data URI prefix if present
  const base64 = imageData.replace(/^data:image\/\w+;base64,/, "");

  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("image", base64);

  const res = await fetch(IMGBB_API, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`imgbb upload failed: ${err}`);
  }

  const data = await res.json();
  return {
    url: data.data.url,
    deleteUrl: data.data.delete_url,
  };
}
