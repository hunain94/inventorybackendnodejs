const prisma = require("../prisma/client");

//Insert new category
exports.insertCategory = async (req, res) => {
    try {
        const { categoryname, isactive } = req.body;

        if (!categoryname) {
            return res.status(400).json({ message: "Category name is required" });
        }
        // Use logged-in user id from token
        const fk_userid = req.user.user_id;

        const newCategory = await prisma.tblcategories.create({
            data: {
                categoryname,
                isactive: isactive || "1", //default active
                fk_userid,
                created_at: new Date()
            }
        });

        res.status(201).json({
            message: "Category created successfully",
            category: newCategory
        });
    } catch (error) {
        console.error("Create category error:", error);

        //Handle unique constraint violation
        if (error.code === 'P2002') {
            return res.status(409).json({ message: "Category name already exists" });
        }

        res.status(500).json({ message: "Server error" });
    }
};

//Get all categories
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await prisma.tblcategories.findMany({
            where: { isactive: "1" } //only active categories
        })

        res.json(categories);

    } catch (error) {
        console.error("Get categories error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

//Get category by ID
exports.getCategoryById = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);

        const category = await prisma.tblcategories.findUnique({
            where: { category_id: categoryId }
        });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.json(category);
    } catch (error) {
        console.error("Get category by ID error:", error);
        res.status(500).json({ message: "Failed to fetch category" });
    }
};

//Update category
exports.updateCategory = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.id);
        const { categoryname, isactive } = req.body;

        const existing = await prisma.tblcategories.findUnique({
            where: { category_id: categoryId }
        });

        if (!existing) {
            return res.status(404).json({ message: "Category not found" });
        }

        const updated = await prisma.tblcategories.update({
            where: { category_id: categoryId },
            data: {
                categoryname: categoryname || existing.categoryname,
                isactive: isactive || existing.isactive,
                modified_at: new Date()
            }
        });

        res.json(updated);
    } catch (error) {
        console.error("Update category error:", error);


        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Category name already exists" });
        }

        res.status(500).json({ message: "Failed to update category" });
    }
};

//Delete category

exports.deleteCategory = async (req, res) => {
    try { 
        const categoryId = parseInt(req.params.id);

        const existing = await prisma.tblcategories.findUnique({
            where: { category_id: categoryId }
        });

        if(!existing) {
            return res.status(404).json({ message: "Category not found" });
        }

        await prisma.tblcategories.update({
            where: { category_id: categoryId },
            data: { isactive: "0", modified_at: new Date() } //soft delete
        })

        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Delete category error:", error);
        res.status(500).json({ message: "Failed to delete category" });
    }
}