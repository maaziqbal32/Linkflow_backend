const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const COOKIE_NAME = "linkflow_token";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

function createToken(userId) {
  return jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function safeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
}
// Register function 
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error: "Name, email and password are required.",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length < 2) {
      return res.status(400).json({
        error: "Name must contain at least 2 characters.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        error: "Please enter a valid email address.",
      });
    }

    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      return res.status(400).json({
        error:
          "Password must contain at least 8 characters, a letter and a number.",
      });
    }
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
    });

    const token = createToken(user._id);

    setAuthCookie(res, token);

    return res.status(201).json({
      message: "Account created successfully.",
      user: safeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      error: "Failed to create account.",
    });
  }
}
// Login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    const token = createToken(user._id);

    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Login successful.",
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      error: "Failed to login.",
    });
  }
}

// Logout
function logout(req, res) {
  res.clearCookie(COOKIE_NAME, cookieOptions);

  return res.status(200).json({
    message: "Logged out successfully.",
  });
}

// Get current logged-in user
async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    return res.status(200).json({
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Current user error:", error);

    return res.status(500).json({
      error: "Failed to fetch user.",
    });
  }
}

// Update profile
async function updateProfile(req, res) {
  try {
    const { name } = req.body;

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        error: "Name must contain at least 2 characters.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { name: name.trim() } },
      { new: true, runValidators: true },
    );

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Profile update error:", error);

    return res.status(500).json({
      error: "Failed to update profile.",
    });
  }
}

// Change password
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        error: "Both passwords are required.",
      });
    }

    if (
      newPassword.length < 8 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      return res.status(400).json({
        error: "New password must contain at least 8 characters, a letter and a number.",
      });
    }

    const user = await User.findById(req.user.userId).select(
      "+passwordHash",
    );

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    const matches = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!matches) {
      return res.status(400).json({
        error: "Current password is incorrect.",
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);

    await user.save();

    // Require a fresh login after password change
    res.clearCookie(COOKIE_NAME, cookieOptions);

    return res.status(200).json({
      message: "Password changed successfully. Please login again.",
    });
  } catch (error) {
    console.error("Password update error:", error);

    return res.status(500).json({
      error: "Failed to change password.",
    });
  }
}

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
};