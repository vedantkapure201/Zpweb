// netlify/functions/delete-photo.js
// Deletes a photo from Netlify Blobs by key

import { getStore } from "@netlify/blobs";

export const config = {
  path: "/api/delete-photo",
};

export default async function handler(req, context) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "DELETE") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { key, password } = body;

    const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || "1234@gadivat";
    if (password !== TEACHER_PASSWORD) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    if (!key) {
      return new Response(JSON.stringify({ error: "Missing key" }), { status: 400 });
    }

    const store = getStore({ name: "school-photos", consistency: "strong" });
    await store.delete(key);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Delete error:", err);
    return new Response(JSON.stringify({ error: "Delete failed", detail: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
