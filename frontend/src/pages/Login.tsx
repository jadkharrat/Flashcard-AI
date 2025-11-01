import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/authApi";

function Login() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setLoading(true);
        try {
            const response = await login({ username, password });
            localStorage.setItem("token", response.token);
            localStorage.setItem("user", JSON.stringify(response.user));
            navigate("/home");
        } catch (error) {
            if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage("An error occurred during login.");
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/home");
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-500">
            <form onSubmit={handleSubmit} className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">Login</h2>

            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />

            {errorMessage && <p className="text-red-500 text-center mb-3">{errorMessage}</p>}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-bold py-2 px-4 rounded-lg shadow transition"
            >
                {loading ? "Logging in..." : "Login"}
            </button>

            <p className="w-full text-center mt-4 text-gray-700 dark:text-gray-300">
                Don't have an account?{" "}
                <Link to="/register" className="text-indigo-600 hover:underline font-medium">
                    Register
                </Link>
            </p>
            </form>
        </div>
    )
}

export default Login;