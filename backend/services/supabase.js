import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing Supabase configuration. Please check your .env file.");
  process.exit(1);
}

function buildSearchClause(search) {
  const trimmed = search.trim();
  if (!trimmed) return "";

  const escaped = trimmed.replace(/[%_,()]/g, "\\$&");
  const pattern = `*${escaped}*`;
  return `&or=(${["text", "url", "title"]
    .map((field) => `${field}.ilike.${encodeURIComponent(pattern)}`)
    .join(",")})`;
}

/**
 * Authentication service for Supabase
 */
export const authService = {
  /**
   * Sign in a user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Authentication response
   */
  async signIn(email, password) {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, password }),
      },
    );

    return response.json();
  },

  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Sign up response
   */
  async signUp(email, password) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email, password }),
    });

    return response.json();
  },

  /**
   * Refresh an access token using a refresh token
   * @param {string} refreshToken - The refresh token
   * @returns {Promise<Object>} - Authentication response with new tokens
   */
  async refreshToken(refreshToken) {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
    );

    return response.json();
  },
};

/**
 * Snaps service for Supabase
 */
export const snapsService = {
  /**
   * Get all snaps for a user
   * @param {string} userEmail - User email
   * @param {string} token - User authentication token
   * @param {number} [page=1] - Page number (1-indexed)
   * @param {number} [limit=20] - Number of items per page
   * @returns {Promise<Array>} - Array of snaps
   */
  async getSnaps(userEmail, token, page = 1, limit = 20, search = "") {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;
    const end = offset + limitNum - 1;

    let url = `${SUPABASE_URL}/rest/v1/snaps?user_email=eq.${encodeURIComponent(userEmail)}&order=created_at.desc&limit=${limitNum}&offset=${offset}`;

    url += buildSearchClause(search);

    console.log("Supabase query URL:", url);

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Range: `${offset}-${end}`,
        Prefer: "count=exact",
      },
    });

    console.log("Supabase response status:", response.status);
    const data = await response.json();
    console.log("Supabase response data:", data);

    // Extract total count from Content-Range header (format: "0-19/123" or "*/123")
    const contentRange = response.headers.get("content-range");
    const totalCount = contentRange
      ? parseInt(contentRange.split("/")[1], 10)
      : null;

    return { data, totalCount };
  },

  /**
   * Create a new snap
   * @param {Object} snapData - Snap data
   * @param {string} token - User authentication token
   * @returns {Promise<Object>} - Created snap
   */
  async createSnap(snapData, token) {
    console.log("Creating snap with data:", snapData);

    const response = await fetch(`${SUPABASE_URL}/rest/v1/snaps`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(snapData),
    });

    console.log("Snap creation response status:", response.status);
    const data = await response.json();
    console.log("Snap creation response data:", data);

    return data;
  },

  /**
   * Delete a snap owned by the authenticated user
   * @param {number} snapId - Snap id
   * @param {string} userEmail - User email
   * @param {string} token - User authentication token
   * @returns {Promise<boolean>} - Whether a snap was deleted
   */
  async deleteSnap(snapId, userEmail, token) {
    await fetch(
      `${SUPABASE_URL}/rest/v1/snap_tags?snap_id=eq.${snapId}`,
      {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/snaps?id=eq.${snapId}&user_email=eq.${encodeURIComponent(userEmail)}`,
      {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          Prefer: "return=representation",
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete snap: ${errorText}`);
    }

    const deletedRows = await response.json();
    return Array.isArray(deletedRows) && deletedRows.length > 0;
  },
};

/**
 * Storage service for Supabase
 */
export const storageService = {
  /**
   * Upload a file to Supabase storage
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} userEmail - User email
   * @param {string} token - User authentication token
   * @returns {Promise<string>} - File URL
   */
  async uploadFile(fileBuffer, fileName, userEmail, token) {
    // Sanitize inputs to prevent path traversal
    const safeEmail = String(userEmail).replace(/[^a-zA-Z0-9@._-]/g, "");
    const safeFileName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, "");

    if (!safeEmail || !safeFileName) {
      throw new Error("Invalid user email or file name");
    }

    const objectPath = `${safeEmail}/${safeFileName}`;
    const candidateBuckets = [
      SUPABASE_STORAGE_BUCKET,
      "screenshots",
      "SCREENSHOTS",
    ].filter(Boolean);

    let lastError = "";

    for (const bucket of [...new Set(candidateBuckets)]) {
      const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${bucket}/${objectPath}`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/octet-stream",
          },
          body: fileBuffer,
        },
      );

      if (response.ok) {
        return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectPath}`;
      }

      lastError = await response.text();
      console.error(`Storage upload failed for bucket "${bucket}":`, lastError);
    }

    throw new Error(`Failed to upload file: ${lastError}`);
  },
};

/**
 * Tags service for Supabase
 */
export const tagsService = {
  /**
   * Get all tags for a user
   */
  async getTags(userEmail, token) {
    const url = `${SUPABASE_URL}/rest/v1/tags?user_email=eq.${encodeURIComponent(userEmail)}&order=created_at.desc`;
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
    return response.json();
  },

  /**
   * Create a new tag
   */
  async createTag(tagData, token) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify(tagData),
    });
    return response.json();
  },

  /**
   * Delete a tag
   */
  async deleteTag(tagId, token) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/tags?id=eq.${tagId}`,
      {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.ok;
  },

  /**
   * Assign a tag to a snap
   */
  async assignTagToSnap(snapId, tagId, token) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/snap_tags`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Prefer: "return=representation",
      },
      body: JSON.stringify({ snap_id: snapId, tag_id: tagId }),
    });
    return response.json();
  },

  /**
   * Remove a tag from a snap
   */
  async removeTagFromSnap(snapId, tagId, token) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/snap_tags?snap_id=eq.${snapId}&tag_id=eq.${tagId}`,
      {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.ok;
  },

  /**
   * Get snaps for a specific tag
   */
  async getSnapsByTag(
    tagId,
    userEmail,
    token,
    page = 1,
    limit = 20,
    search = "",
  ) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;
    const end = offset + limitNum - 1;

    let url = `${SUPABASE_URL}/rest/v1/snaps?select=*,snap_tags!inner(tag_id)&user_email=eq.${encodeURIComponent(userEmail)}&snap_tags.tag_id=eq.${tagId}&order=created_at.desc&limit=${limitNum}&offset=${offset}`;

    url += buildSearchClause(search);

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Range: `${offset}-${end}`,
        Prefer: "count=exact",
      },
    });
    const data = await response.json();
    const contentRange = response.headers.get("content-range");
    const totalCount = contentRange
      ? parseInt(contentRange.split("/")[1], 10)
      : data.length;
    return { snaps: data, totalCount, page: pageNum, limit: limitNum };
  },

  /**
   * Get all tags assigned to a specific snap
   */
  async getTagsForSnap(snapId, token) {
    const url = `${SUPABASE_URL}/rest/v1/snap_tags?select=tag:tags(*)&snap_id=eq.${snapId}`;
    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return data.map((entry) => entry.tag).filter(Boolean);
  },
};
