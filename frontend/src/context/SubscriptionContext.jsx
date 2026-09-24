/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import { useAuth } from "./AuthContext";
import { useSubscription } from "../hooks/useSubscription";

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ enabled = true, children }) => {
    const { user } = useAuth();
    const value = useSubscription(user, { enabled });

    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscriptionContext = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error(
            "useSubscriptionContext must be used within a SubscriptionProvider"
        );
    }
    return context;
};