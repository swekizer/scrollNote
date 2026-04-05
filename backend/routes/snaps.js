import express from "express";
import { snapsService, tagsService } from "../services/supabase.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

/**
 * Validates snap data before creation
 * @param {Object} data - The snap data to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSnapData(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Request body must be a JSON object"] };
  }

  if (
    !data.text ||
    typeof data.text !== "string" ||
    data.text.trim().length === 0
  ) {
    errors.push("Text is required and must be a non-empty string");
  } else if (data.text.length > 10000) {
    errors.push("Text must not exceed 10,000 characters");
  }

  if (!data.url || typeof data.url !== "string") {
    errors.push("URL is required and must be a string");
  } else {
    try {
      new URL(data.url);
    } catch {
      errors.push("URL must be a valid URL format");
    }
  }

  if (!data.user_email || typeof data.user_email !== "string") {
    errors.push("User email is required and must be a string");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.user_email)) {
    errors.push("User email must be a valid email format");
  }

  if (data.title && typeof data.title !== "string") {
    errors.push("Title must be a string");
  }

  if (data.h1 && typeof data.h1 !== "string") {
    errors.push("H1 must be a string");
  }

  if (data.note && typeof data.note !== "string") {
    errors.push("Note must be a string");
  } else if (data.note && data.note.length > 5000) {
    errors.push("Note must not exceed 5,000 characters");
  }

  if (data.screenshot && typeof data.screenshot !== "string") {
    errors.push("Screenshot must be a string (URL or base64)");
  }

  if (data.position) {
    if (typeof data.position !== "object" || Array.isArray(data.position)) {
      errors.push("Position must be an object with x and y properties");
    } else if (
      typeof data.position.x !== "number" ||
      typeof data.position.y !== "number"
    ) {
      errors.push("Position must have numeric x and y values");
    }
  }

  if (data.timestamp) {
    const date = new Date(data.timestamp);
    if (isNaN(date.getTime())) {
      errors.push("Timestamp must be a valid ISO date string");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * @route GET /api/snaps
 * @desc Get all snaps for a user
 * @access Private
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const userEmail = req.user.email;
    const search = req.query.search || "";

    console.log("GET /api/snaps - User Email:", userEmail, "- Search:", search);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await snapsService.getSnaps(
      userEmail,
      token,
      page,
      limit,
      search,
    );
    console.log("Snaps retrieved from Supabase:", result.data);
    res.json({
      snaps: result.data,
      totalCount: result.totalCount,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error fetching snaps:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch snaps",
    });
  }
});

/**
 * @route POST /api/snaps
 * @desc Create a new snap
 * @access Private
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const snapData = req.body;

    // Validate input data
    const validation = validateSnapData(snapData);
    if (!validation.valid) {
      return res.status(400).json({
        error: true,
        message: "Invalid snap data",
        errors: validation.errors,
      });
    }

    // Sanitize: trim strings
    const sanitizedData = {
      ...snapData,
      text: snapData.text.trim(),
      url: snapData.url.trim(),
      title: snapData.title?.trim() || "",
      h1: snapData.h1?.trim() || "",
      note: snapData.note?.trim() || "",
      user_email: snapData.user_email.trim(),
    };

    const newSnap = await snapsService.createSnap(sanitizedData, token);
    res.status(201).json(newSnap);
  } catch (error) {
    console.error("Error creating snap:", error);
    res.status(500).json({
      error: true,
      message: "Failed to create snap",
    });
  }
});

/**
 * @route GET /api/snaps/:id/tags
 * @desc Get all tags assigned to a specific snap
 * @access Private
 */
router.get("/:id/tags", authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const snapId = parseInt(req.params.id, 10);

    if (isNaN(snapId)) {
      return res.status(400).json({
        error: true,
        message: "Invalid snap ID",
      });
    }

    const tags = await tagsService.getTagsForSnap(snapId, token);
    res.json(tags);
  } catch (error) {
    console.error("Error fetching snap tags:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch tags for snap",
    });
  }
});

export default router;
