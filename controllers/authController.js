const prisma = require("../prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1. Validate input

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        //2. Find user in database
        const user = await prisma.tblusers.findUnique({
            where: { username }
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid username" });
        }

        //3. Compare passwords

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        //4. Generate JWT token
        const token = jwt.sign(
            { user_id: user.user_id, username: user.username, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        //5. Send response
        res.json({
            token,
            user: {
                id: user.user_id,
                username: user.username,
                roleId: user.role_id
            },
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }

};