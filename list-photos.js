// netlify/functions/list-photos.js
// Returns all stored photo URLs for a given section (activities, achievements, gallery)

import { getStore } from "@netlify/blobs";

export const config = {
  path: "/api/list-photos",
};

export default async function handler(req, context) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const section = url.searchParams.get("section") || "";

    const store = getStore({
      name: "school-photos",
      consistency: "strong",
    });

    const { blobs } = await store.list({
      prefix: section ? `${section}/` : "",
    });

    const photos = await Promise.all(
      blobs.map(async (blob) => {
        const meta = await store.getMetadata(blob.key);
        return {
          key: blob.key,
          url: `/.netlify/blobs/school-photos/${blob.key}`,
          caption: meta?.metadata?.caption || "",
          section: meta?.metadata?.section || "",
          uploadedAt: meta?.metadata?.uploadedAt || "",
        };
      })
    );

    // Sort newest first
    photos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return new Response(JSON.stringify({ success: true, photos }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("List error:", err);
    return new Response(JSON.stringify({ error: "Failed to list photos", detail: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
