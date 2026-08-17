const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5050";
const API_URL = `${API_BASE_URL}/api/auth`;

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
    const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if(!response.ok){
        let message = "Registration failed";

        try {
            const err = await response.json();
            if (err?.error) message = err.error;
            else if (err?.message) message = err.message;
        } catch {
            const text = await response.text();
            if (text) message = text;
        }

        throw new Error(message);
    }

    return response.json();
}

async function login(data: {
    username: string;
    password: string;
}): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if(!response.ok){
        let message = "Login failed";

        try {
            const err = await response.json();
            if (err?.error) message = err.error;
            else if (err?.message) message = err.message;
        } catch {
            const text = await response.text();
            if (text) message = text;
        }

        throw new Error(message);
    }

    return response.json();
}

export { register, login };
export type { UserInfo, AuthResponse };
