/**
 * Low-intent public forms: feedback, contact, newsletter.
 * Protected by Turnstile + stricter rate limits.
 */

const express = require("express");

const router = express.Router();

const {
  lowIntentFormLimiter,
} = require("../middlewares/rateLimiter");
const {
  requireTurnstile,
} = require("../middlewares/turnstileMiddleware");
const logger = require("../utils/logger");
const {
  appendOpsAuditEntry,
} = require("../services/operations/opsAuditService");

router.use(lowIntentFormLimiter);

router.post(
  "/feedback",
  requireTurnstile,
  async (req, res) => {
    try {
      const {
        category,
        description,
        email,
        name,
        route,
        context,
        screenshotDataUrl,
        userAgent,
      } = req.body || {};

      const text = String(description || "").trim();

      if (!text || text.length < 8) {
        logger.info({
          event: "validation_failed",
          form: "feedback",
          reason: "description_short",
        });
        return res.status(400).json({
          success: false,
          message:
            "Please provide a short description (8+ characters).",
        });
      }

      await appendOpsAuditEntry({
        action: "site_feedback",
        actorRole: "buyer",
        actorLabel: String(
          name || email || "anonymous"
        ).slice(0, 120),
        targetType: "page",
        targetId: String(route || "unknown").slice(
          0,
          500
        ),
        metadata: {
          category: String(
            category || "other"
          ).slice(0, 64),
          description: text.slice(0, 4000),
          email: String(email || "").slice(0, 200),
          context:
            context && typeof context === "object"
              ? context
              : {},
          hasScreenshot: Boolean(screenshotDataUrl),
          userAgent: String(userAgent || "").slice(
            0,
            300
          ),
        },
      });

      logger.info({
        event: "feedback_submitted",
        category,
        route,
      });

      res.status(201).json({ success: true });
    } catch (err) {
      logger.error({
        event: "feedback_error",
        message: err?.message,
      });
      res.status(500).json({
        success: false,
        message: "Unable to record feedback",
      });
    }
  }
);

router.post(
  "/contact",
  requireTurnstile,
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        subject,
        message,
      } = req.body || {};

      const cleanName = String(name || "").trim();
      const cleanEmail = String(email || "")
        .trim()
        .toLowerCase();
      const cleanMessage = String(
        message || ""
      ).trim();

      if (cleanName.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Please enter your name.",
        });
      }

      if (
        !cleanEmail ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          cleanEmail
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email.",
        });
      }

      if (cleanMessage.length < 10) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a message (10+ characters).",
        });
      }

      await appendOpsAuditEntry({
        action: "contact_form",
        actorRole: "buyer",
        actorLabel: cleanName.slice(0, 120),
        targetType: "contact",
        targetId: String(subject || "general").slice(
          0,
          120
        ),
        metadata: {
          email: cleanEmail,
          phone: String(phone || "")
            .replace(/\D/g, "")
            .slice(0, 15),
          message: cleanMessage.slice(0, 4000),
        },
      });

      logger.info({
        event: "contact_submitted",
        email: cleanEmail,
      });

      res.status(201).json({
        success: true,
        message: "Message received. We will get back to you soon.",
      });
    } catch (err) {
      logger.error({
        event: "contact_error",
        message: err?.message,
      });
      res.status(500).json({
        success: false,
        message: "Unable to send message",
      });
    }
  }
);

router.post(
  "/newsletter",
  requireTurnstile,
  async (req, res) => {
    try {
      const email = String(req.body?.email || "")
        .trim()
        .toLowerCase();

      if (
        !email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      ) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid email.",
        });
      }

      await appendOpsAuditEntry({
        action: "newsletter_signup",
        actorRole: "buyer",
        actorLabel: email,
        targetType: "newsletter",
        targetId: email,
        metadata: {
          source:
            String(req.body?.source || "footer").slice(
              0,
              64
            ),
        },
      });

      logger.info({
        event: "newsletter_signup",
        email,
      });

      res.status(201).json({
        success: true,
        message: "You are subscribed to EVSavari updates.",
      });
    } catch (err) {
      logger.error({
        event: "newsletter_error",
        message: err?.message,
      });
      res.status(500).json({
        success: false,
        message: "Unable to subscribe",
      });
    }
  }
);

module.exports = router;
