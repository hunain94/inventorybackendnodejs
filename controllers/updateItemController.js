const prisma = require('../prisma/client');
const sendEmail = require('../utils/sendEmail');
const generateTemplate = require('../templates/dailyReportTemplate');

//Product By CategoryId
exports.getProductsByCategory = async (req, res) => {

    try {
        const categoryId = parseInt(req.params.categoryId);

        const products = await prisma.tblproducts.findMany({
            where: {
                fk_categoryid: categoryId
            },
            include: {
                tblcategories: {
                    select: {
                        categoryname: true
                    },
                },
            },
        });
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
}

//Update Item Quantity
exports.updateItemQuantity = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        // Use logged-in user id from token
        const fk_userid = req.user.user_id;
        const { quantity, type, remarks } = req.body;

        if (!quantity || !type) {
            return res
                .status(400)
                .json({ error: 'Quantity and type are required' });
        }

        const product = await prisma.tblproducts.findUnique({
            where: { product_id: productId },
        });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        let newQuantity = product.quantity;

        if (type === 'add') {
            newQuantity += Number(quantity);
        } else if (type === 'subtract') {
            if (product.quantity < quantity) {
                return res.status(400).json({ error: 'Insufficient stock' });
            }
            newQuantity -= Number(quantity);

        } else {
            return res.status(400).json({ error: 'Invalid type. Must be "add" or "subtract"' });
        }

        const result = await prisma.$transaction([
            prisma.tblproducts.update({
                where: { product_id: productId },
                data:
                {
                    quantity: newQuantity,
                    modified_at: new Date()
                },
            }),

            prisma.tblproductslogs.create({
                data: {
                    fk_productid: product.product_id,
                    fk_categoryid: product.fk_categoryid,
                    fk_userid: fk_userid,
                    product_name: product.product_name,
                    quantity: Number(quantity),
                    amount: product.amount,
                    isactive: product.isactive,
                    remarks: remarks || `${type} stock`,
                },
            }),
        ]);

        res.json({
            message: 'Stock Updated Successfully',
            updatedProduct: result[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update item quantity' });
    }
};

exports.getProductTrail = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);

        const product = await prisma.tblproducts.findUnique({
            where: {
                product_id: productId,
            },
        });

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const logs = await prisma.tblproductslogs.findMany({
            where: {
                fk_productid: product.product_id, // since logs don't store product_id
            },
            orderBy: {
                created_at: "desc",
            },
        });

        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch product trail" });
    }
};

exports.sendDailyProductReport = async () => {
    try {
        console.log("Sending daily product report...");

        //Get today's start & end
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        //Fetch products updates today
        const products = await prisma.tblproducts.findMany({
            where: {
                modified_at: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                tblcategories: {
                    select: { categoryname: true },
                },
                tblusers: {
                    select: { username: true },
                }
            },
        })

        if (!products.length) {
            console.log("No product updates today.");
            return;
        }

        //Fetch admin users
        const admins = await prisma.tblusers.findMany({
            where: { role_id: 1 },
        })

        const adminEmails = admins.map(admin => admin.email);

        if (!adminEmails.length) {
            console.log("No admin users found to send the report.");
            return;
        }


        // Generate HTML template
        const html = generateTemplate(products);

        // Send email
        await sendEmail({
            to: adminEmails,
            subject: "Daily Product Update Report",
            html,
        });

        console.log("Report email sent successfully");

    } catch (err) {
        console.error("Failed to send daily product report:", err);
    }
}
