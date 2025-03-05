const express = require("express");
const userRoute = express.Router();
import bcrypt from "bcryptjs";
import { NextFunction, Request, Response } from "express";
const User = require("../model/user.model");
import jwt from "jsonwebtoken";
import { Otp_template } from "../templete/otpTemplate";
import bannerModel from "../model/banner.model";
import TenderMapping from "../model/tender.mapping.model";
import TransactionModel from "../model/tender.priceing.model";
const { transporter } = require("../nodemailer");
import Razorpay from "razorpay";
import TenderRequest from "../model/tenderRequest.model";
import Tender from "../model/tender.model";
import DeletedUser from "../model/deletedUser.model";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZOR_API_KEY,
  key_secret: process.env.NEXT_PUBLIC_RAZOR_API_SECRET,
});

const getTotalCount = (duration: string) => {
  switch (duration) {
    case "Per Month":
      return 24;
    case "Per Half Year":
      return 4;
    case "Per Year":
      return 2;
    default:
      throw new Error("Invalid duration");
  }
};

const authenticateUser = (req: any, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1]; // Get token from header

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, "secretkey");
    req.user = { userId: (decoded as { userId: string }).userId };
    next(); // Proceed to next middleware or route handler
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ message: "Invalid token." });
  }
};

const generateUniqueClientId = async () => {
  // Find the maximum client ID across both active and deleted users
  const [lastActiveUser, lastDeletedUser] = await Promise.all([
    User.findOne({ clientId: { $exists: true } }, { clientId: 1 })
      .sort({ clientId: -1 })
      .exec(),
    DeletedUser.findOne({ clientId: { $exists: true } }, { clientId: 1 })
      .sort({ clientId: -1 })
      .exec(),
  ]);

  // Determine the maximum client ID
  let maxClientId = null;
  if (lastActiveUser && lastDeletedUser) {
    maxClientId =
      lastActiveUser.clientId > lastDeletedUser.clientId
        ? lastActiveUser.clientId
        : lastDeletedUser.clientId;
  } else if (lastActiveUser) {
    maxClientId = lastActiveUser.clientId;
  } else if (lastDeletedUser) {
    maxClientId = lastDeletedUser.clientId;
  }

  // If no client ID exists, start from the first
  if (!maxClientId) return "#TO-0001";

  // Increment the client ID
  const prefix = maxClientId.slice(0, 4);
  const number = parseInt(maxClientId.slice(4), 10);
  const nextNumber = (number + 1).toString().padStart(4, "0");
  return `${prefix}${nextNumber}`;
};

userRoute.post("/create/account", async (req: any, res: any) => {
  try {
    const {
      phone,
      email,
      password,
      name,
      companyName,
      isGoogleAuth,
      profile_image,
    } = req.body;

    // Generate unique client ID
    const clientId = await generateUniqueClientId();

    // Validate the user input
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if the email or phone number already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingUser) {
      return res
        .status(200)
        .json({ message: "User already exists.", code: 400 });
    }

    // Calculate default free 3-day subscription validity
    const subscriptionValidity = new Date();
    subscriptionValidity.setDate(subscriptionValidity.getDate() + 3);

    // Create a new user with the 3-day free subscription validity
    const newUser = new User({
      phone,
      email,
      password: hashedPassword,
      name,
      companyName,
      subscriptionValidity, // Add the default 3-day subscription
      isGoogleAuth,
      profile_image,
      clientId, // Use the newly generated unique client ID
      paymentStatus: "Free trial",
    });

    await newUser.save();

    // Generate JWT token for the newly created user
    const token = jwt.sign({ userId: newUser._id }, "secretkey", {
      expiresIn: "354d",
    });

    res.status(201).json({
      message: "User registered successfully.",
      accessToken: token,
      subscriptionValidity, // Return the subscription validity to the user
      clientId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error registering user.");
  }
});

userRoute.post("/create/account/google", async (req: any, res: any) => {
  try {
    const { email, name, picture, isGoogleAuth } = req.body;

    // Generate unique client ID
    const clientId = await generateUniqueClientId();

    // Check if the user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // If user exists, generate a JWT token
      const token = jwt.sign({ userId: existingUser._id }, "secretkey", {
        expiresIn: "354d",
      });

      return res.status(200).json({
        message: "User already exists.",
        accessToken: token,
        subscriptionValidity: existingUser.subscriptionValidity,
        clientId: existingUser.clientId, // Return existing client ID
      });
    }

    // Create a new user with the generated client ID
    const newUser = new User({
      email,
      name,
      profile_image: picture,
      phone: "",
      subscriptionValidity: new Date(
        new Date().setDate(new Date().getDate() + 3)
      ),
      isGoogleAuth: true,
      password: "google", // Default password for Google-authenticated users
      clientId, // Add the generated client ID
      paymentStatus: "Free trial",
    });

    await newUser.save();

    // Generate a JWT token for the newly created user
    const token = jwt.sign({ userId: newUser._id }, "secretkey", {
      expiresIn: "354d",
    });

    res.status(201).json({
      message: "User registered successfully.",
      accessToken: token,
      subscriptionValidity: newUser.subscriptionValidity,
      clientId, // Return the new client ID
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error registering user with Google.");
  }
});

userRoute.post(
  "/create-subscription",
  authenticateUser,
  async (req: any, res: any) => {
    const { planId, duration } = req.body;
    const userId = req.user.userId;
    try {
      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        total_count: getTotalCount(duration),
        customer_notify: 1,
        notes: {
          user_id: userId,
          duration: duration,
        },
      });
      res.status(200).json({
        subscriptionId: subscription.id,
        shortUrl: subscription.short_url,
        status: subscription.status,
      });
    } catch (error) {
      console.error("Razorpay subscription creation error:", error);
      res.status(error.statusCode || 500).json({
        error: {
          code: error.code || "INTERNAL_SERVER_ERROR",
          description:
            error.description ||
            "An error occurred while creating the subscription",
        },
      });
    }
  }
);

userRoute.post(
  "/subscribe/newsletter",
  authenticateUser,
  async (req: any, res: any) => {
    const { subscriptionId } = req.body;
    const userId = req.user.userId;

    try {
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // let validityDuration;
      // switch (duration) {
      //   case "Per Month":
      //     validityDuration = 30;
      //     break;
      //   case "Per Half Year":
      //     validityDuration = 182;
      //     break;
      //   case "Per Year":
      //     validityDuration = 365;
      //     break;
      //   default:
      //     return res.status(400).json({ message: "Invalid duration value" });
      // }

      // let subscriptionValidity = new Date();
      // if (user.subscriptionValidity && user.subscriptionValidity > new Date()) {
      //   subscriptionValidity = new Date(user.subscriptionValidity);
      // }
      // subscriptionValidity.setDate(
      //   subscriptionValidity.getDate() + validityDuration
      // );

      // if (isNaN(subscriptionValidity.getTime())) {
      //   return res
      //     .status(400)
      //     .json({ message: "Invalid subscription validity date" });
      // }

      // user.isPayment = true;
      // user.paymentStatus = "Completed";
      // user.subscriptionValidity = subscriptionValidity;
      user.currentSubscriptionId = subscriptionId;
      // user.currentSubscriptionPlanId = planId;
      // user.subscriptionAmount = amount;
      // user.lastSubscriptionDate = new Date();

      // user.subscriptionHistory.push({
      //   subscriptionId,
      //   planId,
      //   amount,
      //   duration,
      //   subscriptionDate: new Date(),
      //   validUntil: subscriptionValidity,
      // });

      await user.save();

      res.status(201).json({
        message: "Subscription successful",
        subscriptionId,
      });
    } catch (error) {
      console.error("Subscription verification error:", error);
      res.status(500).json({
        message: "An error occurred",
        error: {
          code: error.code || "INTERNAL_SERVER_ERROR",
          description: error.description || "Failed to verify subscription",
        },
      });
    }
  }
);

userRoute.post(
  "/payment/success/executive",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      const userId = req?.user?.userId;

      const { amount_received, payment_method, content } = req.body;

      const transaction = new TransactionModel({
        userId,
        amount_received,
        price: amount_received,
        payment_method,
        total_amount_paid: amount_received,
        transaction_status: "Completed",
        discount_applied: 0.0,
        tax_amount: 0.0,
        content,
      });

      await transaction.save();

      res.status(200).json({
        code: 200,
        message: "Payment successful",
        transaction,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "An error occurred", error });
    }
  }
);

userRoute.get("/payment/transcation", async (req: Request, res: Response) => {
  try {
    const transactions = await TransactionModel.find({}).populate("userId");
    res.status(200).send(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting transactions.");
  }
});

userRoute.post("/payment/transcation", async (req: Request, res: Response) => {
  try {
    const user = await User.findOne({ clientId: req.body.clientId });
    if (!user) {
      return res.status(404).send("User not found.");
    }

    const transactions = await TransactionModel.find({
      userId: user._id,
    }).populate("userId");

    res.status(200).send(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting transactions.");
  }
});

// forgot password
userRoute.post("/forgot/password", async (req: Request, res: Response) => {
  try {
    const password = req.body.password;
    const email = req.body.email;
    if (!("email" in req.body)) {
      return res.status(400).json({
        status: "failed",
        status_code: 400,
        message: "email keyword Does Not Exist In Request",
        result: {},
      });
    }
    // change new password handler

    const user: any = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();
    res.status(200).send({
      message: "Password changed successfully.",
      code: 200,
      newPassword: password,
    });
  } catch (err) {
    return res.status(400).send({
      status: "failed",
      status_code: 400,
      message: "Something went wrong!",
      result: {},
    });
  }
});

// Utility function to add days to a date
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

userRoute.get("/status", authenticateUser, async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const user: any | null = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // const currentTime = new Date()
    const currentTime = new Date();
    const freeTrialStart = user.subscriptionValidity || currentTime; // Use current time if no start time is set
    const tendersVisibleUntil = freeTrialStart;
    const isTendersVisible = tendersVisibleUntil > currentTime;
    if (!isTendersVisible) {
      await User.findOneAndUpdate(
        {
          _id: userId,
        },
        {
          paymentStatus: "Free Trial Expired",
        }
      );
      await user.save();
    }

    res.status(200).json({
      userId: user._id,
      tendersVisibleUntil,
      isTendersVisible,
      paymentStatus: user.paymentStatus,
      status: user.status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting user status." });
  }
});

userRoute.get("/get/account", async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.status(200).send(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting users.");
  }
});

// Login API
userRoute.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send("User not found.");
    }

    const isGoogleAuth = user.isGoogleAuth;

    if (user.status === "Inactive") {
      return res.status(200).json({
        message: "Your account has been deactivated. Please contact support.",
        code: 401,
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).send("Invalid password.");
    }
    const token = jwt.sign({ userId: user._id }, "secretkey", {
      expiresIn: "354d",
    });
    res.status(200).send({ token });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error logging in.");
  }
});

userRoute.post("/google/login", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message: "User not found.",
        code: 404,
      });
    }

    // Assuming you may want to add more checks or handle user creation here
    const token = jwt.sign({ userId: user._id }, "secretkey"); // Use a consistent secret key

    res.status(200).send({ token });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error logging in.");
  }
});

userRoute.post("/otp", async (req: Request, res: Response) => {
  try {
    const email = req.body.email;
    if (!("email" in req.body)) {
      return res.status(400).json({
        status: "failed",
        status_code: 400,
        message: "email keyword Does Not Exist In Request",
        result: {},
      });
    }
    // req.body.email = user_data.email
    // OTP handler
    var digits = "0123456789";
    let OTP = "";
    for (let i = 0; i < 6; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }

    let sendMessage = {
      from: "support@tenderonline.in",
      to: email,
      subject: ` ${OTP} is Your OTP for Authentication at Tenderonline`,
      html: Otp_template(OTP),
    };

    transporter.sendMail(sendMessage, function (err: any, info: any) {
      console.log("err ********", err);
      console.log("info ********", info);
      if (err) {
        console.log(err);

        return res.status(400).send({
          status: "failed",
          status_code: 400,
          message: err,
          result: {},
        });
      } else {
        return res.status(200).send({
          status: "success",
          status_code: 200,
          message: "mail send successfully",
          result: [
            {
              otp: OTP,
            },
          ],
        });
      }
    });
  } catch (err) {
    return res.status(400).send({
      status: "failed",
      status_code: 400,
      message: "Something went wrong!",
      result: {},
    });
  }
});

userRoute.post("/admin/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const AdminEmail = "admin@tenderonline.co.in";
    const AdminPassword = "TO_admin@555";

    if (email !== AdminEmail) {
      return res.status(404).send("User not found.");
    }

    if (password !== AdminPassword) {
      return res.status(401).send("Invalid password");
    }

    const token = jwt.sign({ email, password }, "secretkey", {
      expiresIn: "354d",
    });
    res.status(200).send({ token });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error logging in.");
  }
});

userRoute.get("/me", authenticateUser, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send("User not found.");
    }
    res.status(200).send(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting user.");
  }
});

userRoute.post(
  "/suggestion",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      const { classification, industry, state } = req.body;

      if (!classification || !industry || !state) {
        return res.status(400).send("All fields are required.");
      }

      const userId = req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).send("User not found.");
      }

      user.classification = classification;
      user.industry = industry;
      user.state = state;

      await user.save();

      res.status(200).send({
        message: "User details updated successfully.",
        user,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error getting user.");
    }
  }
);

// check user already added suggestion or not
userRoute.get(
  "/suggestion/check",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      const userId = req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).send("User not found.");
      }
      if (user.classification && user.industry && user.state) {
        return res.status(200).send({
          message: "User has already added suggestions.",
          suggestion: {
            classification: user.classification,
            industry: user.industry,
            state: user.state,
          },
        });
      } else {
        return res.status(200).send({
          message: "User has not added any suggestions yet.",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send("Error checking user suggestions.");
    }
  }
);

userRoute.get("/users", async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;

    // If search query is provided, filter users based on name or email
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { companyName: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find(query);
    res.status(200).send(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting users.");
  }
});

// delete user with id /users/:id
userRoute.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found.", code: 404 });
    }

    try {
      await DeletedUser.create({
        originalId: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        status: user.status,
        isPayment: user.isPayment,
        subscriptionValidity: user.subscriptionValidity,
        companyName: user.companyName,
        paymentStatus: user.paymentStatus,
        clientId: user.clientId, // Explicitly save the clientId in deleted users
        improvement: user.improvement || "",
        deletedAt: new Date(),
      });
    } catch (archiveError) {
      console.error("Error archiving user:", archiveError);
    }

    // Now delete the user
    const deletedUser = await User.findByIdAndDelete(req.params.id);

    if (!deletedUser) {
      return res
        .status(404)
        .json({ message: "User could not be deleted.", code: 404 });
    }

    res.status(200).json({
      message: "User deleted successfully.",
      code: 200,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      message: "Error deleting user.",
      error: error.message,
      code: 500,
    });
  }
});

userRoute.get("/deleted-users", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";

    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
          { companyName: { $regex: search, $options: "i" } },
          { clientId: { $regex: search, $options: "i" } },
        ],
      };
    }

    const deletedUsers = await DeletedUser.find(query)
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await DeletedUser.countDocuments(query);

    res.status(200).json({
      deletedUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      totalUsers,
    });
  } catch (error) {
    console.error("Error fetching deleted users:", error);
    res.status(500).json({ message: "Error fetching deleted users" });
  }
});

// update user status with id /users/:id/status
userRoute.patch("/users/:id/status", async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found.", code: 404 });
    }
    console.log(req.body.status, user, "req.body.status");

    user.status = req.body.status;
    await user.save();
    res.status(200).json({
      message: "User status updated successfully.",
      code: 200,
      status: user.status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error updating user status.");
  }
});

userRoute.post("/banner", async (req: Request, res: Response) => {
  try {
    const { banner, isSignup, isActive } = req.body;

    // Validation: Ensure the 'banner' field exists and is not empty
    if (!banner || typeof banner !== "string" || banner.trim() === "") {
      return res.status(400).send({ error: "Invalid banner data." });
    }

    // Check if a banner already exists (assuming you only ever have one banner)
    const existingBanner: any = await bannerModel.findOne();

    if (existingBanner) {
      // If a banner already exists, update it
      existingBanner.banner = banner;
      existingBanner.isSignup = isSignup;
      existingBanner.isActive = isActive;

      await existingBanner.save();
      return res.status(200).send({
        message: "Banner updated successfully.",
        banner: existingBanner,
      });
    } else {
      // If no banner exists, create a new one
      const newBanner = await bannerModel.create({
        banner,
        isSignup,
        isActive,
      });
      return res
        .status(201)
        .send({ message: "Banner created successfully.", banner: newBanner });
    }
  } catch (error) {
    console.error("Error processing banner request:", error);
    return res.status(500).send({ error: "Error adding/updating banner." });
  }
});

userRoute.get("/banner", async (req: Request, res: Response) => {
  try {
    const banner = await bannerModel.findOne();
    return res.status(200).send({ banner });
  } catch (error) {
    console.error("Error fetching banner:", error);
    return res.status(500).send({ error: "Error fetching banner." });
  }
});

userRoute.put("/me", authenticateUser, async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Extract and update user fields dynamically
    const updateFields: any = req.body;
    Object.keys(updateFields).forEach((field) => {
      if (updateFields[field as keyof any]) {
        user[field as keyof any] = updateFields[field as keyof any]!;
      }
    });

    await user.save();

    res.status(200).json({
      message: "User profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the user profile." });
  }
});

userRoute.get(
  "/me/tender",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      const userId = req.user.userId;
      const mappings = await TenderMapping.find({ userId })
        .populate("tenderId userId")
        .sort({ createdAt: -1 });

      res.status(200).json({ mappings });
    } catch (error) {
      console.log("Error retrieving mappings:", error);

      res.status(500).json({ message: "Error retrieving mappings.", error });
    }
  }
);

userRoute.get(
  "/me/tenderRequest",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      const userId = req.user.userId;
      const mappings = await TenderRequest.find({ userId })
        .populate("tenderId")
        .populate("userId")
        .sort({ createdAt: -1 });

      res.status(200).json({ mappings });
    } catch (error) {
      console.log("Error retrieving mappings:", error);

      res.status(500).json({ message: "Error retrieving mappings.", error });
    }
  }
);

userRoute.post(
  "/change-password",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      // Validate password strength on backend as well
      const passwordRegex = {
        minLength: /.{8,}/,
        uppercase: /[A-Z]/,
        number: /[0-9]/,
        special: /[!@#$%^&*(),.?":{}|<>]/,
      };

      if (!passwordRegex.minLength.test(newPassword)) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters." });
      }
      if (!passwordRegex.uppercase.test(newPassword)) {
        return res.status(400).json({
          message: "Password must contain at least one uppercase letter.",
        });
      }
      if (!passwordRegex.number.test(newPassword)) {
        return res
          .status(400)
          .json({ message: "Password must contain at least one number." });
      }
      if (!passwordRegex.special.test(newPassword)) {
        return res.status(400).json({
          message: "Password must contain at least one special character.",
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect." });
      }

      // Check if new password is the same as the current password
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return res.status(400).json({
          message: "New password cannot be the same as your current password.",
        });
      }

      // Hash and save new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
      console.error("Error updating password:", error);
      res
        .status(500)
        .json({ message: "An error occurred while updating the password." });
    }
  }
);

// keyword suggestion
userRoute.post(
  "/keyword/suggestion",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      const { keyword } = req.body;

      if (!keyword) {
        return res.status(400).send("Invalid keyword data.");
      }

      const userId = req.user.userId;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).send("User not found.");
      }

      // add keyword to user if already not exist
      if (!user.keyword.includes(keyword)) {
        user.keyword.push(keyword);
      }

      await user.save();

      res.status(200).send({
        message: "User keyword updated successfully.",
        user,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error getting user.");
    }
  }
);

// get user keyword
userRoute.get("/keyword", authenticateUser, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found.");
    }

    return res.status(200).send({
      message: "User keyword list.",
      keyword: user.keyword,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error getting user keyword.");
  }
});

userRoute.get("/allUsersKeywords", async (req: any, res: Response) => {
  const user = await User.find();
  return res.status(200).send({
    message: "All user keyword list.",
    user,
  });
});

userRoute.get("/allmessages", async (req: any, res: Response) => {
  const user = await User.find();
  return res.status(200).send({
    message: "All User feedback messages",
    user,
  });
});

// message improvement
userRoute.get(
  "/messages",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      const userId = req.user.userId;

      // Find user by ID
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      // Return the improvement messages array
      return res.status(200).json({
        messages: user.improvement,
        timestampImprovement: user.timestampImprovement,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ error: "Error fetching messages." });
    }
  }
);

userRoute.post(
  "/message",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      const userId = req.user.userId;
      const { message } = req.body;

      // Validation: Ensure 'message' field is a valid string
      if (!message || typeof message !== "string" || message.trim() === "") {
        return res.status(400).json({ error: "Invalid message data." });
      }

      // Find user by ID
      const existingUser = await User.findById(userId);

      if (!existingUser) {
        return res.status(404).json({ error: "User not found." });
      }

      // Append new message to the 'improvement' array
      existingUser.improvement.push(message);

      // Add current timestamp to timestampImprovement array
      existingUser.timestampImprovement.push(new Date().toISOString());

      // Save the updated document
      await existingUser.save();

      return res.status(200).json({
        message: "Message added successfully.",
        improvement: existingUser.improvement,
        timestampImprovement: existingUser.timestampImprovement,
      });
    } catch (error) {
      console.error("Error processing message request:", error);
      return res.status(500).json({ error: "Error adding/updating message." });
    }
  }
);
// Check if a tender is saved
userRoute.post(
  "/check-saved-tender",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      const userId = req.user.userId;
      const { tenderId } = req.body;

      if (!tenderId) {
        return res.status(400).json({ error: "Tender ID is required" });
      }

      const mapping = await TenderMapping.findOne({
        userId,
        tenderId,
        type: "saved",
      });

      return res.status(200).json({ isSaved: !!mapping });
    } catch (error) {
      console.error("Error checking saved tender:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

// Save/unsave tender
userRoute.post(
  "/save-tender",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      const userId = req.user.userId;
      const { tenderId } = req.body;

      if (!tenderId) {
        return res.status(400).json({ error: "Tender ID is required" });
      }

      const existingMapping = await TenderMapping.findOne({
        userId,
        tenderId,
        type: "saved",
      });

      if (existingMapping) {
        // If mapping exists, remove it (unsave)
        await TenderMapping.findByIdAndDelete(existingMapping._id);
        return res.status(200).json({ message: "Tender unsaved successfully" });
      } else {
        // If mapping doesn't exist, create it (save)
        const newMapping = new TenderMapping({
          userId,
          tenderId,
          type: "saved",
          status: "saved",
        });
        await newMapping.save();
        return res.status(200).json({ message: "Tender saved successfully" });
      }
    } catch (error) {
      console.error("Error saving/unsaving tender:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

// Get saved tenders
userRoute.get(
  "/saved-tenders",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      const userId = req.user.userId;

      // Pagination parameters
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = page * limit;

      // Find all saved tender mappings for this user
      const savedMappings = await TenderMapping.find({
        userId,
        type: "saved",
      })
        .sort({ createdAt: -1 }) // Most recently saved first
        .skip(skip)
        .limit(limit);

      // Extract tender IDs
      const tenderIds = savedMappings.map((mapping) => mapping.tenderId);

      // Fetch the actual tender details
      const tenders = await Tender.find({
        _id: { $in: tenderIds },
      });

      // Get total count for pagination
      const totalCount = await TenderMapping.countDocuments({
        userId,
        type: "saved",
      });

      // Map tenders to maintain the original sort order from savedMappings
      const sortedTenders = tenderIds
        .map((id) =>
          tenders.find((tender: any) => tender._id.toString() === id.toString())
        )
        .filter(Boolean);

      return res.status(200).json({
        result: sortedTenders,
        count: totalCount,
        User,
      });
    } catch (error) {
      console.error("Error fetching saved tenders:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

userRoute.get(
  "/all-saved-tenders",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      // Pagination parameters
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = page * limit;

      // Find all mappings with type "saved"
      const savedMappings = await TenderMapping.find({
        type: "saved",
      })
        .populate("userId", "username email name") // Populate user details
        .populate("tenderId") // Populate tender details
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Filter out entries where userId is null
      const validMappings = savedMappings.filter((mapping) => mapping.userId);

      // Group tenders by user
      const tendersByUser = validMappings.reduce((acc: any, mapping: any) => {
        const userId = mapping.userId._id.toString();

        if (!acc[userId]) {
          acc[userId] = {
            user: {
              _id: mapping.userId._id,
              username: mapping.userId.username,
              email: mapping.userId.email,
              name: mapping.userId.name,
            },
            tenders: [],
          };
        }

        acc[userId].tenders.push(mapping.tenderId);
        return acc;
      }, {});

      // Convert to array format for easier frontend handling
      const result = Object.values(tendersByUser);

      // Get total count for pagination
      const totalCount = await TenderMapping.countDocuments({
        type: "saved",
        userId: { $ne: null }, // Count only valid records
      });

      return res.status(200).json({
        result,
        count: totalCount,
      });
    } catch (error) {
      console.error("Error fetching all saved tenders:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

userRoute.get(
  "/user-saved-tenders/:userId",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      const { userId } = req.params;

      // Pagination parameters
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = page * limit;

      // Get user details
      const user = await User.findById(userId).select("username email name");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Find saved mappings for the specific user
      const savedMappings = await TenderMapping.find({
        type: "saved",
        userId: userId,
      })
        .populate("tenderId") // Populate tender details
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // Extract tenders from mappings
      const tenders = savedMappings
        .map((mapping: any) => mapping.tenderId)
        .filter((tender: any) => tender !== null);

      // Get total count for pagination
      const totalCount = await TenderMapping.countDocuments({
        type: "saved",
        userId: userId,
      });

      return res.status(200).json({
        user,
        tenders,
        count: totalCount,
      });
    } catch (error) {
      console.error("Error fetching user's saved tenders:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

userRoute.get(
  "/users-with-saved-tenders",
  authenticateUser,
  async (req: any, res: Response) => {
    try {
      // Pagination parameters
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = page * limit;

      // Find unique users who have saved tenders
      const uniqueUsers = await TenderMapping.aggregate([
        { $match: { type: "saved" } },
        { $group: { _id: "$userId" } },
        { $sort: { _id: 1 } },
        { $skip: skip },
        { $limit: limit },
      ]);

      const userIds = uniqueUsers
        .map((item) => item._id)
        .filter((id) => id != null);

      // Fetch user details
      const users = await User.find({
        _id: { $in: userIds },
      }).select("_id name email username clientId");

      // Get total count for pagination
      const totalCount = await TenderMapping.aggregate([
        { $match: { type: "saved" } },
        { $group: { _id: "$userId" } },
        { $match: { _id: { $ne: null } } },
        { $count: "total" },
      ]);

      const count = totalCount.length > 0 ? totalCount[0].total : 0;

      return res.status(200).json({
        users,
        count,
      });
    } catch (error) {
      console.error("Error fetching users with saved tenders:", error);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = userRoute;
