// /* eslint-disable react-refresh/only-export-components */
// import { createContext, useContext, useEffect, useState } from "react";
// import { fetchCurrentUser } from "../services/authService";

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//     const [user, setUser] = useState(() => {
//         const saved = localStorage.getItem("wb_user");
//         return saved ? JSON.parse(saved) : null;
//     });
//     const [token, setToken] = useState(() => localStorage.getItem("wb_token"));
//     const [loading, setLoading] = useState(true);


//     useEffect(() => {
//         const bootstrap = async () => {
//             const savedToken = localStorage.getItem("wb_token");

//             if (!savedToken) {
//                 setLoading(false);
//                 return;
//             }

//             try {
//                 const data = await fetchCurrentUser();
//                 setUser(data.user);
//                 localStorage.setItem("wb_user", JSON.stringify(data.user));
//             } catch (error) {
//                 const code = error?.response?.data?.code;
//                 const status = error?.response?.status;
//                 const tokenIsDead =
//                     status === 401 &&
//                     ["NO_TOKEN", "TOKEN_INVALID", "ACCOUNT_NOT_FOUND"].includes(code);

//                 if (tokenIsDead) {
//                     localStorage.removeItem("wb_token");
//                     localStorage.removeItem("wb_user");
//                     setUser(null);
//                     setToken(null);
//                 }
//                 console.log(error)
//             } finally {
//                 setLoading(false);
//             }
//         };

//         bootstrap();
//     }, []);

//     const login = ({ token: newToken, user: newUser }) => {
//         localStorage.setItem("wb_token", newToken);
//         localStorage.setItem("wb_user", JSON.stringify(newUser));
//         setToken(newToken);
//         setUser(newUser);
//     };

//     const logout = () => {
//         localStorage.removeItem("wb_token");
//         localStorage.removeItem("wb_user");
//         setToken(null);
//         setUser(null);
//     };

//     const updateUser = (partialUser) => {
//         setUser((prev) => {
//             const next = { ...(prev || {}), ...partialUser };
//             localStorage.setItem("wb_user", JSON.stringify(next));
//             return next;
//         });
//     };

//     return (
//         <AuthContext.Provider
//             value={{
//                 user,
//                 token,
//                 loading,
//                 isAuthenticated: Boolean(token),
//                 login,
//                 logout,
//                 updateUser,
//             }}
//         >
//             {children}
//         </AuthContext.Provider>
//     );
// };

// export const useAuth = () => {
//     const context = useContext(AuthContext);
//     if (!context) {
//         throw new Error("useAuth must be used within an AuthProvider");
//     }
//     return context;
// };

/* eslint-disable react-refresh/only-export-components */
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { fetchCurrentUser } from "../services/authService";

const AuthContext = createContext(null);

const readSavedUser = () => {
    try {
        const saved = localStorage.getItem("wb_user");
        return saved ? JSON.parse(saved) : null;
    } catch {
        // Corrupt value in storage: start clean instead of crashing the app.
        localStorage.removeItem("wb_user");
        return null;
    }
};

const saveUser = (user) => {
    try {
        localStorage.setItem("wb_user", JSON.stringify(user));
    } catch {
        // Storage full or blocked: the in-memory user still works.
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(readSavedUser);
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
                // The response includes childMode: { enabled, hasPin }, so a
                // stale saved user (from before Child Mode existed) is
                // corrected on every page load.
                const data = await fetchCurrentUser();
                setUser(data.user);
                saveUser(data.user);
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
                console.log(error);
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, []);

    const login = ({ token: newToken, user: newUser }) => {
        localStorage.setItem("wb_token", newToken);
        saveUser(newUser);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        localStorage.removeItem("wb_token");
        localStorage.removeItem("wb_user");
        setToken(null);
        setUser(null);
    };

    // Merges changes into the user. `childMode` is merged one level deep, so
    // updateUser({ childMode: { enabled: true } }) keeps `hasPin` intact.
    const updateUser = useCallback((partialUser) => {
        setUser((prev) => {
            const base = prev || {};
            const next = { ...base, ...partialUser };

            if (partialUser?.childMode) {
                next.childMode = {
                    ...(base.childMode || {}),
                    ...partialUser.childMode,
                };
            }

            saveUser(next);
            return next;
        });
    }, []);

    // Shortcut for the Child Mode modal callbacks.
    //   setChildMode({ enabled: true, hasPin: true })
    const setChildMode = useCallback(
        (childMode) => updateUser({ childMode }),
        [updateUser]
    );

    // Re-reads the user from the server (e.g. after a Child Mode change you
    // want confirmed by the backend). Returns the fresh user, or null.
    const refreshUser = useCallback(async () => {
        try {
            const data = await fetchCurrentUser();
            setUser(data.user);
            saveUser(data.user);
            return data.user;
        } catch (error) {
            console.log(error);
            return null;
        }
    }, []);

    const childModeOn = Boolean(user?.childMode?.enabled);
    const hasChildPin = Boolean(user?.childMode?.hasPin);

    const value = useMemo(
        () => ({
            user,
            token,
            loading,
            isAuthenticated: Boolean(token),
            childModeOn,
            hasChildPin,
            login,
            logout,
            updateUser,
            setChildMode,
            refreshUser,
        }),
        // login/logout only touch state setters, so they are safe to omit.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [user, token, loading, childModeOn, hasChildPin, updateUser, setChildMode, refreshUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};