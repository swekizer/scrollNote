import express from "express";
import { tagsService } from "../services/supabase.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route GET /api/tags
 * @desc Get all tags for the authenticated user
 * @access Private
 */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const userEmail = req.user.email;

    const tags = await tagsService.getTags(userEmail, token);
    res.json(tags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch tags",
    });
  }
});

/**
 * @route POST /api/tags
 * @desc Create a new tag for the authenticated user
 * @access Private
 */
router.post("/", authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        error: true,
        message: "Tag name is required",
      });
    }

    const tagData = {
      name: name.trim(),
      user_email: req.user.email,
    };

    const result = await tagsService.createTag(tagData, token);

    if (result.error) {
      if (result.code === "23505" || result.message?.includes("duplicate")) {
        return res.status(409).json({
          error: true,
          message: "A tag with this name already exists",
        });
      }
      return res.status(400).json({
        error: true,
        message: result.message || "Failed to create tag",
      });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error creating tag:", error);
    res.status(500).json({
      error: true,
      message: "Failed to create tag",
    });
  }
});

/**
 * @route DELETE /api/tags/:id
 * @desc Delete a tag (also removes all snap_tag associations)
 * @access Private
 */
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const tagId = parseInt(req.params.id, 10);

    if (isNaN(tagId)) {
      return res.status(400).json({
        error: true,
        message: "Invalid tag ID",
      });
    }

    const success = await tagsService.deleteTag(tagId, token);

    if (!success) {
      return res.status(404).json({
        error: true,
        message: "Tag not found",
      });
    }

    res.json({ success: true, message: "Tag deleted" });
  } catch (error) {
    console.error("Error deleting tag:", error);
    res.status(500).json({
      error: true,
      message: "Failed to delete tag",
    });
  }
});

/**
 * @route POST /api/tags/:tagId/snaps/:snapId
 * @desc Assign a tag to a snap
 * @access Private
 */
router.post("/:tagId/snaps/:snapId", authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const tagId = parseInt(req.params.tagId, 10);
    const snapId = parseInt(req.params.snapId, 10);

    if (isNaN(tagId) || isNaN(snapId)) {
      return res.status(400).json({
        error: true,
        message: "Invalid tag ID or snap ID",
      });
    }

    const result = await tagsService.assignTagToSnap(snapId, tagId, token);

    if (result.error) {
      return res.status(400).json({
        error: true,
        message: result.message || "Failed to assign tag",
      });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Error assigning tag to snap:", error);
    res.status(500).json({
      error: true,
      message: "Failed to assign tag to snap",
    });
  }
});

/**
 * @route DELETE /api/tags/:tagId/snaps/:snapId
 * @desc Remove a tag from a snap
 * @access Private
 */
router.delete("/:tagId/snaps/:snapId", authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const tagId = parseInt(req.params.tagId, 10);
    const snapId = parseInt(req.params.snapId, 10);

    if (isNaN(tagId) || isNaN(snapId)) {
      return res.status(400).json({
        error: true,
        message: "Invalid tag ID or snap ID",
      });
    }

    const success = await tagsService.removeTagFromSnap(snapId, tagId, token);

    if (!success) {
      return res.status(404).json({
        error: true,
        message: "Tag assignment not found",
      });
    }

    res.json({ success: true, message: "Tag removed from snap" });
  } catch (error) {
    console.error("Error removing tag from snap:", error);
    res.status(500).json({
      error: true,
      message: "Failed to remove tag from snap",
    });
  }
});

/**
 * @route GET /api/tags/:tagId/snaps
 * @desc Get all snaps for a specific tag
 * @access Private
 */
router.get("/:tagId/snaps", authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const tagId = parseInt(req.params.tagId, 10);
    const userEmail = req.user.email;
    const search = req.query.search || "";

    if (isNaN(tagId)) {
      return res.status(400).json({
        error: true,
        message: "Invalid tag ID",
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const snaps = await tagsService.getSnapsByTag(
      tagId,
      userEmail,
      token,
      page,
      limit,
      search,
    );

    res.json(snaps);
  } catch (error) {
    console.error("Error fetching snaps by tag:", error);
    res.status(500).json({
      error: true,
      message: "Failed to fetch snaps for tag",
    });
  }
});

export default router;
