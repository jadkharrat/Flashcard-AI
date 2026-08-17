import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import AuthLayout from "../components/AuthLayout";

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

    const handleDemo = () => {
        sessionStorage.setItem("demoMode", "true");
        navigate("/home");
    }

    useEffect(() => {
    const token = localStorage.getItem("token");
    const demoMode = sessionStorage.getItem("demoMode");
    if (token || demoMode) navigate("/home");
    }, [navigate]);

    return (
        <AuthLayout>
            <div className="auth-card">
                <div className="auth-card__heading">
                    <p className="eyebrow">Welcome back</p>
                    <h2>Continue your study session</h2>
                    <p>Sign in to generate a new deck from your course material.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        autoComplete="username"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}

                    <button type="submit" disabled={loading} className="button button--primary button--full">
                        {loading ? <><span className="button-spinner" /> Signing in…</> : "Sign in"}
                    </button>
                </form>

                <div className="auth-divider"><span>or explore first</span></div>

                <button type="button" className="button button--secondary button--full" onClick={handleDemo}>
                    Preview a sample deck
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
                </button>

                <p className="auth-switch">
                    New to RecallAI? <Link to="/register">Create an account</Link>
                </p>
            </div>
        </AuthLayout>
    )
}

export default Login;
