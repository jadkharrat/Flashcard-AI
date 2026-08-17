import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/authApi";
import AuthLayout from "../components/AuthLayout";

function Register() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [surname, setSurname] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setLoading(true);
        try {
            const response = await register({ username, password, name, surname });
            localStorage.setItem("token", response.token);
            localStorage.setItem("user", JSON.stringify(response.user));
            navigate("/home");
        } catch (error) {
            if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage("An error occurred during registration.");
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
    const token = localStorage.getItem("token");
    const demoMode = sessionStorage.getItem("demoMode");
    if (token || demoMode) navigate("/home");
    }, [navigate]);

    return (
        <AuthLayout>
            <div className="auth-card auth-card--register">
                <div className="auth-card__heading">
                    <p className="eyebrow">Create your workspace</p>
                    <h2>Start learning actively</h2>
                    <p>Your next study deck is one PDF away.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-row">
                        <div>
                            <label htmlFor="name">First name</label>
                            <input id="name" type="text" autoComplete="given-name" placeholder="Jad" value={name} onChange={(e) => setName(e.target.value)} required />
                        </div>
                        <div>
                            <label htmlFor="surname">Last name</label>
                            <input id="surname" type="text" autoComplete="family-name" placeholder="Kharrat" value={surname} onChange={(e) => setSurname(e.target.value)} required />
                        </div>
                    </div>

                    <label htmlFor="username">Username</label>
                    <input id="username" type="text" autoComplete="username" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} required />

                    <label htmlFor="password">Password</label>
                    <input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />

                    {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}

                    <button type="submit" disabled={loading} className="button button--primary button--full">
                        {loading ? <><span className="button-spinner" /> Creating account…</> : "Create account"}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </AuthLayout>
    )
}

export default Register;
