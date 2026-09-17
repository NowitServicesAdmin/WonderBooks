/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { fetchCurrentUser } from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("wb_user");
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem("wb_token"));
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const bootstrap = async () => {
            const savedToken = localStorage.getItem("wb_token");

            if (!savedToken) {
                setLoading(false);
                return;
            }

            try {
                const data = await fetchCurrentUser();
                setUser(data.user);
                localStorage.setItem("wb_user", JSON.stringify(data.user));
            } catch (error) {
                localStorage.removeItem("wb_token");
                localStorage.removeItem("wb_user");
                setUser(null);
                setToken(null);
                console.log(error)
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, []);

    const login = ({ token: newToken, user: newUser }) => {
        localStorage.setItem("wb_token", newToken);
        localStorage.setItem("wb_user", JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem("wb_token");
        localStorage.removeItem("wb_user");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                isAuthenticated: Boolean(token),
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
