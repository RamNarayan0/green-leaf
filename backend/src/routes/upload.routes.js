const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const { authenticate } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize");

// Single image upload
router.post("/image", authenticate, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({
      message: "File uploaded successfully",
      url: imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

// Multiple images upload
router.post("/images", authenticate, upload.array("images", 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const images = req.files.map((file) => ({
      url: `/uploads/${file.filename}`,
      filename: file.filename,
    }));

    res.json({
      message: "Files uploaded successfully",
      images,
    });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

module.exports = router;
