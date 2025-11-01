import { Router } from "express";
import prisma from "../database/connection.ts";
import { hashPassword, verifyPassword } from "../utils/hash.ts";
import { generateToken } from "../utils/token.ts";

const router = Router();

router.post("/register", async (req, res) => {
    try {
        const { username, password, name, surname } = req.body;
        
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(409).json({ error: "Username already exists" });
        }

        if(!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                name,
                surname
            }
        });

        const token = generateToken({ id: newUser.id, username: newUser.username });

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: newUser.id,
                username: newUser.username,
                name: newUser.name,
                surname: newUser.surname
            }
        });

    } catch (error) {
        console.error("Error during registration:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
})

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }
        
        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: "Invalid username or password" });
        }
        
        const token = generateToken({id: user.id, username: user.username });

        return res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                surname: user.surname
            }
        });
    } catch (error) {
        console.error("Error during login:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
})

export default router;