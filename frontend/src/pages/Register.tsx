import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/authApi";
import AuthLayout from "../components/AuthLayout";
import PasswordField from "../components/PasswordField";
import { saveAuthSession } from "../lib/session";
import {
    NAME_MAX_LENGTH,
    PASSWORD_MAX_BYTES,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
    validateName,
    validatePassword,
    validateUsername,
} from "../lib/authValidation";

function Register() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [surname, setSurname] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Create an account — RecallAI";
    }, []);

    const clearError = () => {
        if (errorMessage) setErrorMessage("");
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setErrorMessage("");

        const normalizedName = name.trim();
        const normalizedSurname = surname.trim();
        const normalizedUsername = username.trim().toLowerCase();
        const validationError =
            validateName(normalizedName, "First name") ||
            validateName(normalizedSurname, "Last name") ||
            validateUsername(normalizedUsername) ||
            validatePassword(password);

        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        setLoading(true);
        try {
            const response = await register({
                username: normalizedUsername,
                password,
                name: normalizedName,
                surname: normalizedSurname,
            });
            saveAuthSession(response.token, response.user);
            navigate("/home", { replace: true });
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

    return (
        <AuthLayout>
            <div className="auth-card auth-card--register">
                <div className="auth-card__heading">
                    <p className="eyebrow">Create your workspace</p>
                    <h1>Start learning actively</h1>
                    <p>Your next study deck is one PDF away.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form" aria-busy={loading} noValidate>
                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="name">First name</label>
                            <input id="name" name="given-name" type="text" autoComplete="given-name" placeholder="Jad" maxLength={NAME_MAX_LENGTH} value={name} onChange={(e) => { setName(e.target.value); clearError(); }} disabled={loading} required />
                        </div>
                        <div className="form-field">
                            <label htmlFor="surname">Last name</label>
                            <input id="surname" name="family-name" type="text" autoComplete="family-name" placeholder="Kharrat" maxLength={NAME_MAX_LENGTH} value={surname} onChange={(e) => { setSurname(e.target.value); clearError(); }} disabled={loading} required />
                        </div>
                    </div>

                    <div className="form-field">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            aria-describedby="username-hint"
                            placeholder="Choose a username"
                            minLength={USERNAME_MIN_LENGTH}
                            maxLength={USERNAME_MAX_LENGTH}
                            value={username}
                            onChange={(e) => { setUsername(e.target.value); clearError(); }}
                            disabled={loading}
                            required
                        />
                        <span className="field-hint" id="username-hint">Letters, numbers, dots, hyphens, and underscores</span>
                    </div>

                    <PasswordField
                        id="password"
                        name="password"
                        label="Password"
                        autoComplete="new-password"
                        placeholder="Create a secure password"
                        minLength={PASSWORD_MIN_LENGTH}
                        maxLength={PASSWORD_MAX_LENGTH}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearError(); }}
                        disabled={loading}
                        hint={`${PASSWORD_MIN_LENGTH}+ characters · ${PASSWORD_MAX_BYTES}-byte maximum`}
                        required
                    />

                    {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}

                    <button type="submit" disabled={loading} className="button button--primary button--full">
                        {loading ? <><span className="button-spinner" aria-hidden="true" /> Creating account…</> : "Create account"}
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
