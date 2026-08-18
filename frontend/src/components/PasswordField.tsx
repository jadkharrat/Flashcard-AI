import { useState, type InputHTMLAttributes } from "react";

interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    label: string;
    hint?: string;
}

function PasswordField({ id, label, hint, disabled, ...inputProps }: PasswordFieldProps) {
    const [isVisible, setIsVisible] = useState(false);
    const hintId = hint && id ? `${id}-hint` : undefined;
    const describedBy = [inputProps["aria-describedby"], hintId].filter(Boolean).join(" ") || undefined;

    return (
        <div className="form-field">
            <label htmlFor={id}>{label}</label>
            <div className="password-input">
                <input
                    {...inputProps}
                    id={id}
                    type={isVisible ? "text" : "password"}
                    disabled={disabled}
                    aria-describedby={describedBy}
                />
                <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setIsVisible((visible) => !visible)}
                    disabled={disabled}
                    aria-label={isVisible ? "Hide password" : "Show password"}
                    aria-pressed={isVisible}
                >
                    {isVisible ? (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.8 4.4A10.9 10.9 0 0 1 12 4c5.5 0 9 5 9 8a10.7 10.7 0 0 1-2.1 3.8M6.6 6.6C4.3 8.1 3 10.3 3 12c0 3 3.5 8 9 8 1.4 0 2.7-.3 3.8-.8" />
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 12c0-3 3.5-8 9-8s9 5 9 8-3.5 8-9 8-9-5-9-8Z" />
                            <circle cx="12" cy="12" r="2.5" />
                        </svg>
                    )}
                </button>
            </div>
            {hint && <span className="field-hint" id={hintId}>{hint}</span>}
        </div>
    );
}

export default PasswordField;
