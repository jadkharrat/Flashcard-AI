import React, { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [surname, setSurname] = useState<string>("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-colors duration-500">
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
        >
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-gray-100">
            Register
            </h2>

            <div className="space-y-5">
            <div>
                <label
                htmlFor="name"
                className="block text-gray-700 dark:text-gray-300 mb-2 font-medium"
                >
                Name
                </label>
                <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                            bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                            focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                />
            </div>

            <div>
                <label
                htmlFor="surname"
                className="block text-gray-700 dark:text-gray-300 mb-2 font-medium"
                >
                Surname
                </label>
                <input
                id="surname"
                type="text"
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                            bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                            focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                />
            </div>

            <div>
                <label
                htmlFor="username"
                className="block text-gray-700 dark:text-gray-300 mb-2 font-medium"
                >
                Username
                </label>
                <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                            bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                            focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                />
            </div>

            <div>
                <label
                htmlFor="password"
                className="block text-gray-700 dark:text-gray-300 mb-2 font-medium"
                >
                Password
                </label>
                <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                            bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 
                            focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                />
            </div>
            </div>

            <button
            type="submit"
            className="w-full mt-6 px-4 py-2 rounded-lg font-medium shadow transition
                        bg-gray-200 hover:bg-gray-300 text-gray-800
                        dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
            >
            Register
            </button>

            <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
            Already have an account?{" "}
            <Link
                to="/login"
                className="text-gray-900 dark:text-gray-100 underline hover:opacity-80"
            >
                Login
            </Link>
            </p>
        </form>
        </div>
    )
}

export default Register;