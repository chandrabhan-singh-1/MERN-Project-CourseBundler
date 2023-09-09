import express from "express";
import { isAuthenticated } from "../middlewares/auth.js";
import {
  buySubscription,
  cancelSubscription,
  getRazorpayKey,
  paymentVerification,
} from "../controllers/paymentControllers.js";

const router = express.Router();

// Buy Subscription
router.route("/subscription").get(isAuthenticated, buySubscription);

// Verify payment and save reference in database
router.route("/paymentverification").post(isAuthenticated, paymentVerification);

// get RazorPay key
router.route("/razorpaykey").get(getRazorpayKey);

// Cancel Subscription
router
  .route("/subscription/cancel")
  .delete(isAuthenticated, cancelSubscription);

export default router;
