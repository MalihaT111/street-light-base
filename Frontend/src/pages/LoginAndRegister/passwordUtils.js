export const PASSWORD_REQUIREMENTS = [
    { label: 'At least 8 characters', test: (p) => p.length >= 8 },
    { label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
    { label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
    { label: 'One special character (!@#$...)', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export const validatePasswordComplexity = (password) => {
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
    return null;
};