import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import crypto from "crypto";

const schema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please! Enter your name"],
  },
  email: {
    type: String,
    required: [true, "Please! Enter your email"],
    unique: true,
    validate: validator.isEmail,
  },
  password: {
    type: String,
    minLength: [6, "Password must be aleast 6 characters long"],
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  subscription: {
    id: String,
    status: String,
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  playlist: [
    {
      course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
      },
      poster: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  resetPasswordToken: String,
  resetPasswordTokenExpiry: String,
});

schema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  // const hash = await bcrypt.hash(this.password, 10);
  // this.password = hash;
  // or
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

schema.methods.getJWTToken = function () {
  return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "5d",
  });
};

schema.methods.comparePassword = async function (password) {
  const comparisonResult = await bcrypt.compare(password, this.password);
  return comparisonResult;
};

schema.methods.getResetToken = async function () {
  const resetToken = crypto.randomBytes(20).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.resetPasswordTokenExpiry = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

export const User = mongoose.model("user", schema);
