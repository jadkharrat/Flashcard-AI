import { useEffect, useState } from "react";

function getInitialTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function ThemeToggle() {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialTheme);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDarkMode);
        localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    }, [isDarkMode]);

    const label = isDarkMode ? "Switch to light mode" : "Switch to dark mode";

    return (
        <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} className="icon-button" aria-label={label} title={label}>
            {isDarkMode ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
            ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z" /></svg>
            )}
        </button>
    );
}

export default ThemeToggle;
