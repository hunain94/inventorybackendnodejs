const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middleware/authMiddleware");

//POST /api/category

router.post("/insert", authMiddleware, categoryController.insertCategory);
router.get("/", authMiddleware,categoryController.getAllCategories);
router.get("/:id", authMiddleware,categoryController.getCategoryById);
router.put("/:id", authMiddleware, categoryController.updateCategory);
router.delete("/:id", authMiddleware, categoryController.deleteCategory);

module.exports = router;