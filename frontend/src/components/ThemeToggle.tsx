import React, { useEffect, useState } from "react";

function ThemeToggle() {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => 
        localStorage.getItem("theme") === "dark"
    );

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [isDarkMode]);

    return (
        <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="absolute top-4 right-6 px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm font-medium shadow"

        >
            {isDarkMode ? "Light Mode" : "Dark Mode"}
        </button>
    )

}

export default ThemeToggle;