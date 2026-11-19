const express = require("express");
const requireAuth = require("../middlewares/requireAuth");

const {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
} = require("../controllers/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/me", requireAuth, getCurrentUser);
router.patch("/profile", requireAuth, updateProfile);
router.patch("/password", requireAuth, changePassword);

module.exports = router;