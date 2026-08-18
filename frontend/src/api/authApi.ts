import { isRecordResponse, requestJson } from "./client";

interface UserInfo {
    id: number;
    username: string;
    name: string;
    surname: string;
}

interface AuthResponse {
    message: string;
    token: string;
    user: UserInfo;
}

async function register(data: {
    username: string;
    password: string
    name: string;
    surname: string;
}): Promise<AuthResponse> {
    const response = await requestJson<unknown>("/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    return parseAuthResponse(response);
}

async function login(data: {
    username: string;
    password: string;
}): Promise<AuthResponse> {
    const response = await requestJson<unknown>("/api/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    return parseAuthResponse(response);
}

function parseAuthResponse(value: unknown): AuthResponse {
    if (!isRecordResponse(value) || typeof value.token !== "string" || !isRecordResponse(value.user)) {
        throw new Error("The service returned an invalid sign-in response. Please try again.");
    }

    const user = value.user;
    if (
        typeof user.id !== "number" ||
        typeof user.username !== "string" ||
        typeof user.name !== "string" ||
        typeof user.surname !== "string"
    ) {
        throw new Error("The service returned incomplete account information. Please try again.");
    }

    return {
        message: typeof value.message === "string" ? value.message : "Success",
        token: value.token,
        user: {
            id: user.id,
            username: user.username,
            name: user.name,
            surname: user.surname,
        },
    };
}

export { register, login };
export type { UserInfo, AuthResponse };
