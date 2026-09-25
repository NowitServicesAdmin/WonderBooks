import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export const ThemeToggle = ({ className = "" }) => {
    const { isDark, toggleTheme } = useTheme();
    const label = isDark ? "Switch to light theme" : "Switch to dark theme";

    return (
        <button
            type="button"
            onClick={toggleTheme}
            aria-label={label}
            title={label}
            className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-[#5426c7] transition-all duration-200 hover:scale-105 hover:bg-white/70 md:h-11.5 md:w-11.5 ${className}`}
        >
            {isDark ? (
                <Sun strokeWidth={1.8} className="h-6 w-6 md:h-7 md:w-7" />
            ) : (
                <Moon strokeWidth={1.8} className="h-6 w-6 md:h-7 md:w-7" />
            )}
        </button>
    );
};

export default ThemeToggle;
