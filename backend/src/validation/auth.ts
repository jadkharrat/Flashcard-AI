import { z } from "zod";

const usernameSchema = z.string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
        /^[A-Za-z0-9._-]+$/,
        "Username can only contain letters, numbers, dots, underscores, and hyphens",
    )
    .transform((username) => username.toLowerCase());

const passwordSchema = z.string()
    .min(8, "Password must be at least 8 characters")
    .refine(
        (password) => Buffer.byteLength(password, "utf8") <= 72,
        "Password must be at most 72 bytes",
    );

const nameSchema = (label: string) => z.string()
    .trim()
    .min(1, `${label} is required`)
    .max(50, `${label} must be at most 50 characters`);

export const registerBodySchema = z.strictObject({
    username: usernameSchema,
    password: passwordSchema,
    name: nameSchema("First name"),
    surname: nameSchema("Last name"),
});

export const loginBodySchema = z.strictObject({
    username: usernameSchema,
    password: z.string()
        .min(1, "Password is required")
        .refine(
            (password) => Buffer.byteLength(password, "utf8") <= 72,
            "Password must be at most 72 bytes",
        ),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;

export function firstValidationError(error: z.ZodError): string {
    return error.issues[0]?.message ?? "Invalid request";
}
