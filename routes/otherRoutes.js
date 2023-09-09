import express from "express";
import {
  contact,
  courseRequest,
  getDashsboardStats,
} from "../controllers/otherControllers.js";
import { isAuthenticated, authorizeAdmin } from "../middlewares/auth.js";

const router = express.Router();

// contact form
router.route("/contact").post(contact);

// request form
router.route("/courserequest").post(courseRequest);

// Get Admin Dashboard Stats
router
  .route("/admin/stats")
  .get(isAuthenticated, authorizeAdmin, getDashsboardStats);

export default router;
