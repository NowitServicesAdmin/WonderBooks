/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "wb_theme";
const ThemeContext = createContext(null);

const readStoredTheme = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
    } catch {
        return "light";
    }
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(readStoredTheme);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
        root.style.colorScheme = theme;
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            /* storage unavailable (private mode) - the theme just won't persist */
        }
    }, [theme]);

    useEffect(() => {
        const onStorage = (event) => {
            if (event.key === STORAGE_KEY) {
                setTheme(event.newValue === "dark" ? "dark" : "light");
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const toggleTheme = useCallback(() => {
        const root = document.documentElement;
        root.classList.add("wb-theme-switching");
        window.setTimeout(() => root.classList.remove("wb-theme-switching"), 300);
        setTheme((current) => (current === "dark" ? "light" : "dark"));
    }, []);

    const value = useMemo(
        () => ({ theme, isDark: theme === "dark", setTheme, toggleTheme }),
        [theme, toggleTheme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
};
