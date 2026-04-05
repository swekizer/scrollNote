import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

/**
 * Authentication middleware
 * Validates the Bearer token by calling Supabase's /auth/v1/user endpoint.
 * This avoids any JWT secret mismatch — Supabase is the source of truth.
 */
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: true,
        message: "No token, authorization denied",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        error: true,
        message: "No token, authorization denied",
      });
    }

    // Verify token with Supabase directly
    const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Supabase token validation failed:", response.status, errorData);
      return res.status(401).json({
        error: true,
        message: errorData.message || "Invalid or expired token",
      });
    }

    const userData = await response.json();
    const userEmail = userData.email;

    if (!userEmail) {
      return res.status(401).json({
        error: true,
        message: "Invalid token: missing user email",
      });
    }

    // Attach verified user info to request
    req.user = {
      email: userEmail,
      id: userData.id,
      userData,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({
      error: true,
      message: "Authentication check failed",
    });
  }
};
