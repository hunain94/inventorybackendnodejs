const prisma = require("../prisma/client");

//Get all products

exports.getAllProducts = async (req, res) => {
    try {
        const products = await prisma.tblproducts.findMany({
            include: {
                tblcategories: {
                    select: {
                        category_id: true,
                        categoryname: true,
                    },
                },
            },
            orderBy: { created_at: "desc" },
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Get Product by ID
exports.getProductById = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const product = await prisma.tblproducts.findUnique({
            where: { product_id: productId },
            include: {
                tblcategories: {
                    select: {
                        category_id: true,
                        categoryname: true,
                    },
                },
            },
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Insert Product
exports.insertProduct = async (req, res) => {
    try {
        const {
            product_name,
            quantity,
            amount,
            fk_categoryid,
            isactive,
            remarks,
        } = req.body;

        if (!product_name || !fk_categoryid) {
            return res.status(400).json({ message: "Product name and category ID are required" });
        }

        //Validate category existence
        const category = await prisma.tblcategories.findUnique({
            where: { category_id: parseInt(fk_categoryid) },
        });

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        const newProduct = await prisma.tblproducts.create({
            data: {
                product_name,
                quantity: Number(quantity) || 0,
                amount: Number(amount) || 0,
                fk_categoryid: parseInt(fk_categoryid),
                fk_userid: req.user.user_id,
                isactive: isactive || "1",
                remarks,
            },
        });

        res.status(201).json(newProduct);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

//Update Product
exports.updateProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const {
            product_name,
            quantity,
            amount,
            fk_categoryid,
            isactive,
            remarks,
        } = req.body;

        const existing = await prisma.tblproducts.findUnique({
            where: { product_id: productId },
        });

        if (!existing) {
            return res.status(404).json({ message: "Product not found" });
        }

        // If category is changing, validate it
        if (fk_categoryid) {
            const category = await prisma.tblcategories.findUnique({
                where: { category_id: parseInt(fk_categoryid) },
            });

            if (!category) {
                return res.status(400).json({ message: "Invalid category" });
            }
        }

        const updated = await prisma.tblproducts.update({
            where: { product_id: productId },
            data: {
                product_name: product_name ?? existing.product_name,
                quantity: quantity !== undefined ? Number(quantity) : existing.quantity,
                amount: amount !== undefined ? Number(amount) : existing.amount,
                fk_categoryid: fk_categoryid
                    ? parseInt(fk_categoryid)
                    : existing.fk_categoryid,
                isactive: isactive ?? existing.isactive,
                fk_userid: req.user.user_id,
                remarks: remarks ?? existing.remarks,
                modified_at: new Date(),
            },
        });

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update product" });
    }
}

//Delete Product

exports.deleteProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);

        const existing = await prisma.tblproducts.findUnique({
            where: { product_id: productId },
        });

        if (!existing) {
            return res.status(404).json({ message: "Product not found" });
        }

        await prisma.tblproducts.update({
            where: { product_id: productId },
            data: { isactive: "0", modified_at: new Date() }
        });

        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete product" });
    }
};