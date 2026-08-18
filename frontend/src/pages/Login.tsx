import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import AuthLayout from "../components/AuthLayout";
import PasswordField from "../components/PasswordField";
import { saveAuthSession, startDemoSession } from "../lib/session";
import { validatePassword, validateUsername } from "../lib/authValidation";

function Login() {
    const location = useLocation();
    const routeNotice = (location.state as { notice?: unknown } | null)?.notice;
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>(typeof routeNotice === "string" ? routeNotice : "");
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Sign in — RecallAI";
    }, []);

    const clearError = () => {
        if (errorMessage) setErrorMessage("");
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");

        const normalizedUsername = username.trim().toLowerCase();
        const validationError = validateUsername(normalizedUsername) || validatePassword(password);
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        setLoading(true);
        try {
            const response = await login({ username: normalizedUsername, password });
            saveAuthSession(response.token, response.user);
            navigate("/home", { replace: true });
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
        startDemoSession();
        navigate("/home", { replace: true });
    };

    return (
        <AuthLayout>
            <div className="auth-card">
                <div className="auth-card__heading">
                    <p className="eyebrow">Welcome back</p>
                    <h1>Continue your study session</h1>
                    <p>Sign in to generate a new deck from your course material.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form" aria-busy={loading} noValidate>
                    <div className="form-field">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            placeholder="Enter your username"
                            minLength={3}
                            maxLength={30}
                            value={username}
                            onChange={(e) => { setUsername(e.target.value); clearError(); }}
                            disabled={loading}
                            required
                        />
                    </div>

                    <PasswordField
                        id="password"
                        name="password"
                        label="Password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        minLength={8}
                        maxLength={72}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearError(); }}
                        disabled={loading}
                        required
                    />

                    {errorMessage && <p className="form-error" id="login-error" role="alert">{errorMessage}</p>}

                    <button type="submit" disabled={loading} className="button button--primary button--full">
                        {loading ? <><span className="button-spinner" aria-hidden="true" /> Signing in…</> : "Sign in"}
                    </button>
                </form>

                <div className="auth-divider"><span>or explore first</span></div>

                <button type="button" className="button button--secondary button--full" onClick={handleDemo} disabled={loading}>
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
