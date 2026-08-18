export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;
// This keeps native inputs bounded; byte length is validated separately for bcrypt.
export const PASSWORD_MAX_LENGTH = 72;
export const NAME_MAX_LENGTH = 50;

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

export function validateUsername(username: string) {
    const value = username.trim();

    if (!value) return "Enter your username.";
    if (value.length < USERNAME_MIN_LENGTH || value.length > USERNAME_MAX_LENGTH) {
        return `Username must be ${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} characters.`;
    }
    if (!USERNAME_PATTERN.test(value)) {
        return "Use only letters, numbers, dots, hyphens, or underscores.";
    }
    return null;
}

export function validatePassword(password: string) {
    if (!password) return "Enter your password.";
    if (password.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) return `Password must be ${PASSWORD_MAX_BYTES} bytes or fewer.`;
    return null;
}

export function validateName(value: string, label: string) {
    const trimmed = value.trim();
    if (!trimmed) return `Enter your ${label.toLowerCase()}.`;
    if (trimmed.length > NAME_MAX_LENGTH) return `${label} must be ${NAME_MAX_LENGTH} characters or fewer.`;
    return null;
}
