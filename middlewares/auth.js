import jwt, { decode } from "jsonwebtoken";
import { catchAsyncError } from "./catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import { User } from "../models/userModel.js";

export const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("Please! Login first", 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // decoded is an object that we provided to jwt.sign func in the sendToken func
  req.user = await User.findById(decoded._id);

  next();
});

export const authorizeAdmin = catchAsyncError(async (req, res, next) => {
  if (req.user.role !== "admin")
    return next(
      new ErrorHandler(
        `${req.user.role} is not allowed to access this resource!`,
        403
      )
    );
  next();
});

export const authorizeSubscribers = catchAsyncError(async (req, res, next) => {
  if (req.user.subscription.status !== "active" && req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        "Subscribers and Admin only can access this resource!",
        403
      )
    );
  }

  next();
});
