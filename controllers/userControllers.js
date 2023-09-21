import { catchAsyncError } from "../middlewares/catchAsyncError.js";
import { User } from "../models/userModel.js";
import ErrorHandler from "../utils/errorHandler.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendToken } from "../utils/sendToken.js";
import crypto from "crypto";
import { Course } from "../models/courseModel.js";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "cloudinary";
import { Stats } from "../models/stats.js";

// Admin Routes Controller
export const getAllUsers = catchAsyncError(async (req, res, next) => {
  const users = await User.find({});

  res.status(200).json({
    success: true,
    users,
  });
});

export const updateRole = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler("User not found!", 404));
  }

  if (user.role === "user") {
    user.role = "admin";
  } else {
    user.role = "user";
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: `${user.name}'s role updated successfully to be ${user.role}`,
  });
});

export const deleteUser = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHandler("User not found. Maybe already deleted.", 404)
    );
  }

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  // Cancel Subscription of this user

  await user.deleteOne({ _id: req.params.id });

  res.status(200).json({
    success: true,
    message: `${user.name} deleted successfully!`,
  });
});

export const deleteMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  await cloudinary.v2.uploader.destroy(user.avatar.public_id);

  // Cancel subscription of this user

  await user.deleteOne({ _id: req.params._id });

  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
    })
    .json({
      success: true,
      message: `${user.name} Your profile deleted successfully!`,
    });
});

// User Routes Controllers
export const register = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  const file = req.file;

  if (!name || !email || !password || !file) {
    return next(new ErrorHandler("Please! Add all fields.", 400));
  }

  let user = await User.findOne({ email });

  if (user) {
    return next(new ErrorHandler("User already exists!", 409));
  }

  const fileUri = getDataUri(file);

  const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

  user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: mycloud.public_id,
      url: mycloud.secure_url,
    },
  });

  sendToken(res, user, "Registered successfully!", 201);
});

export const login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please! Add all fields.", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Email or Password!", 401));
  }

  const isMatched = await user.comparePassword(password);

  if (!isMatched) {
    return next(new ErrorHandler("Invalid Email or Password!", 400));
  }

  sendToken(res, user, `Welcome Back, ${user.name}!`, 200);
});

export const logout = catchAsyncError(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: false,
      path: "/",
      secure: false,
      sameSite: false,
      domain: "localhost",
    })
    .json({
      success: true,
      message: "Logged-out successfully!",
    });
});

export const getMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    success: true,
    user,
  });
});

export const changePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please! Enter all fields!", 400));
  }

  const user = await User.findById(req.user._id).select("+password");

  const isMatched = await user.comparePassword(oldPassword);

  if (!isMatched) {
    return next(new ErrorHandler("Invalid Old Password!", 400));
  }

  user.password = newPassword;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully!",
  });
});

export const updateProfile = catchAsyncError(async (req, res, next) => {
  const { name, email } = req.body;

  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (email) user.email = email;

  await user.save();
  // {
  //   validator.isEmail(email)
  //     ? await User.updateOne(
  //         { _id: req.user._id },
  //         {
  //           $set: { name: name, email: email },
  //         }
  //       )
  //     : return next(new ErrorHandler("Please! Enter valid email address!", 400));
  // }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully!",
  });
});

export const updateProfilePicture = catchAsyncError(async (req, res, next) => {
  const file = req.file;

  const fileUri = getDataUri(file);

  const user = await User.findById(req.user._id);

  const deltedAvatar = cloudinary.v2.uploader.destroy(user.avatar.public_id);
  const mycloud = cloudinary.v2.uploader.upload(fileUri.content);

  user.avatar = {
    public_id: (await mycloud).public_id,
    url: (await mycloud).secure_url,
  };

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile picture updated successfully!",
  });
});

export const forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found!", 400));
  }

  const resetToken = await user.getResetToken();

  await user.save();

  const url = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

  const message = `<h2>Click <a href=${url}>here</a> to reset your Course Bundler password.<h2><br><p>If the above link does not work then paste the below link in your browser:</p> <br> <a href=${url}>${url}</a><br><p>If you have not request this email then please ignore it.`;

  // send token via email
  await sendEmail(user.email, "Course Reset Password!", message);

  res.status(200).json({
    success: true,
    message: `Reset token has been sent to ${email} successfully!`,
  });
});

export const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Token is Invalid or Expired!", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpiry = undefined;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully!",
  });
});

export const addToPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  const course = await Course.findById(req.body.id);

  if (!course) {
    return next(new ErrorHandler("Invalid course Id!", 404));
  }

  const itemExist = user.playlist.find((item) => {
    return item.course.toString() === course._id.toString() ? true : false;
  });

  if (itemExist)
    return next(new ErrorHandler("Item already in the Playlist!", 409));

  user.playlist.push({ course: course._id, poster: course.poster.url });

  await user.save();

  res.status(200).json({
    success: true,
    message: "Added to the Playlist!",
  });
});

export const removeFromPlaylist = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const course = await Course.findById(req.query.id);
  if (!course) {
    return next(new ErrorHandler("Invalid course Id!", 404));
  }

  // Array.filter() method returns an array therefore
  const newPlaylist = user.playlist.filter((item) => {
    if (item.course.toString() !== course._id.toString()) return item;
  });

  user.playlist = newPlaylist;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Removed from the Playlist!",
  });
});

User.watch().on("change", async () => {
  const stats = await Stats.find({}).sort({ createdAt: "desc" }).limit(1);

  const activeSubscriptions = await User.find({
    "subscription.status": "active",
  });

  stats[0].users = await User.countDocuments();
  stats[0].subscriptions = activeSubscriptions.length;
  stats[0].createdAt = new Date(Date.now());

  await stats[0].save();
});
