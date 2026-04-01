// netlify/functions/upload-image.js
// Receives a base64-encoded image from the frontend,
// stores it in Netlify Blobs, and returns a permanent URL.

import { getStore } from "@netlify/blobs";

export const config = {
  path: "/api/upload-image",
};

export default async function handler(req, context) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { imageBase64, mimeType, caption, section, password } = body;

    // ── Simple password check ──
    const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || "1234@gadivat";
    if (password !== TEACHER_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!imageBase64 || !mimeType) {
      return new Response(JSON.stringify({ error: "Missing imageBase64 or mimeType" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── Convert base64 to binary ──
    const binaryData = Buffer.from(imageBase64, "base64");

    // ── Generate unique key ──
    const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const safeSection = (section || "general").replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const key = `${safeSection}/${timestamp}-${random}.${ext}`;

    // ── Store in Netlify Blobs ──
    const store = getStore({
      name: "school-photos",
      consistency: "strong",
    });

    await store.set(key, binaryData, {
      metadata: {
        caption: caption || "",
        section: section || "general",
        uploadedAt: new Date().toISOString(),
        mimeType,
      },
    });

    // ── Build the public URL ──
    // Netlify Blobs public URL format:
    // /.netlify/blobs/school-photos/<key>
    const publicUrl = `/.netlify/blobs/school-photos/${key}`;

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        key,
        caption: caption || "",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(JSON.stringify({ error: "Upload failed", detail: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
