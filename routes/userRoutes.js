import express from "express";
import {
  addToPlaylist,
  changePassword,
  deleteUser,
  forgotPassword,
  getAllUsers,
  getMyProfile,
  login,
  logout,
  register,
  resetPassword,
  removeFromPlaylist,
  updateProfile,
  updateProfilePicture,
  updateRole,
  deleteMyProfile,
} from "../controllers/userControllers.js";
import { authorizeAdmin, isAuthenticated } from "../middlewares/auth.js";
import singleUpload from "../middlewares/multer.js";

const router = express.Router();

// Admin Routes
// Update user role
// Delete User
router
  .route("/admin/user/:id")
  .put(isAuthenticated, authorizeAdmin, updateRole)
  .delete(isAuthenticated, authorizeAdmin, deleteUser);

// Get all users
router.route("/admin/users").get(isAuthenticated, authorizeAdmin, getAllUsers);

// User Routes
// to register a new user
router.route("/register").post(singleUpload, register);

// Login
router.route("/login").post(login);

// Logout
router.route("/logout").delete(isAuthenticated, logout);

// Get my profile
router.route("/me").get(isAuthenticated, getMyProfile);

// Delete My Profile
router.route("/me").delete(isAuthenticated, deleteMyProfile);

// Change password
router.route("/changepassword").put(isAuthenticated, changePassword);

// Update profile
router.route("/updateprofile").put(isAuthenticated, updateProfile);

// Update profile picture
router
  .route("/updateprofilepicture")
  .put(isAuthenticated, singleUpload, updateProfilePicture);

// Forget password
router.route("/forgotPassword").post(forgotPassword);

// Reset password
router.route("/resetpassword/:token").put(resetPassword);

// Add to playlist
router.route("/addtoplaylist").post(isAuthenticated, addToPlaylist);

// Remove from Playlist
router.route("/removefromplaylist").delete(isAuthenticated, removeFromPlaylist);

export default router;
