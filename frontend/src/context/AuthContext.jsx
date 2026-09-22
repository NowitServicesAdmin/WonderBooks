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
                const code = error?.response?.data?.code;
                const status = error?.response?.status;
                const tokenIsDead =
                    status === 401 &&
                    ["NO_TOKEN", "TOKEN_INVALID", "ACCOUNT_NOT_FOUND"].includes(code);

                if (tokenIsDead) {
                    localStorage.removeItem("wb_token");
                    localStorage.removeItem("wb_user");
                    setUser(null);
                    setToken(null);
                }
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

    const updateUser = (partialUser) => {
        setUser((prev) => {
            const next = { ...(prev || {}), ...partialUser };
            localStorage.setItem("wb_user", JSON.stringify(next));
            return next;
        });
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
                updateUser,
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