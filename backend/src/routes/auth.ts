import { Prisma } from "@prisma/client";
import { Router } from "express";
import prisma from "../database/connection.js";
import { hashPassword, verifyPassword } from "../utils/hash.js";
import { generateToken } from "../utils/token.js";
import {
    firstValidationError,
    loginBodySchema,
    registerBodySchema,
} from "../validation/auth.js";

const router = Router();

router.post("/register", async (req, res, next) => {
    try {
        const body = registerBodySchema.safeParse(req.body);
        if (!body.success) {
            return res.status(400).json({ error: firstValidationError(body.error) });
        }

        const { username, password, name, surname } = body.data;
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(409).json({ error: "Username already exists" });
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
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return res.status(409).json({ error: "Username already exists" });
        }

        next(error);
        return;
    }
});

router.post("/login", async (req, res, next) => {
    try {
        const body = loginBodySchema.safeParse(req.body);
        if (!body.success) {
            return res.status(400).json({ error: firstValidationError(body.error) });
        }

        const { username, password } = body.data;
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" });
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
        next(error);
        return;
    }
});

export default router;
