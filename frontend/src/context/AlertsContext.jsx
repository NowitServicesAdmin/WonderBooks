import {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import api from "../api/axios";
import { useAuth } from "./AuthContext";

export const AlertsContext = createContext(null);

const POLL_MS = 30000;
const PAGE_SIZE = 15;

export function AlertsProvider({ children }) {
    const { user } = useAuth();

    const [unreadCount, setUnreadCount] = useState(0);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);

    const pageRef = useRef(1);

    const fetchUnread = useCallback(async () => {
        try {
            const { data } = await api.get("/alerts/unread-count");

            setUnreadCount(data.unreadCount ?? 0);
        } catch {
            // Keep the last known count
        }
    }, []);

    const loadAlerts = useCallback(async ({ more = false } = {}) => {
        const page = more ? pageRef.current + 1 : 1;

        setLoading(true);

        try {
            const { data } = await api.get("/alerts", {
                params: {
                    page,
                    limit: PAGE_SIZE,
                },
            });

            pageRef.current = page;

            setAlerts((prev) => {
                if (!more) {
                    return data.alerts;
                }

                const seen = new Set(
                    prev.map((a) => a._id)
                );

                return [
                    ...prev,
                    ...data.alerts.filter(
                        (a) => !seen.has(a._id)
                    ),
                ];
            });

            setHasMore(
                Boolean(data.pagination?.hasMore)
            );

            setUnreadCount(
                data.unreadCount ?? 0
            );
        } catch {
            // Leave existing list unchanged
        } finally {
            setLoading(false);
        }
    }, []);

    const markRead = useCallback(
        async (id) => {
            const target = alerts.find(
                (a) => a._id === id
            );

            if (!target || target.isRead) {
                return;
            }

            setAlerts((prev) =>
                prev.map((a) =>
                    a._id === id
                        ? { ...a, isRead: true }
                        : a
                )
            );

            setUnreadCount((c) =>
                Math.max(0, c - 1)
            );

            try {
                await api.patch(
                    `/alerts/${id}/read`
                );
            } catch {
                fetchUnread();
            }
        },
        [alerts, fetchUnread]
    );

    const markAllRead = useCallback(async () => {
        setAlerts((prev) =>
            prev.map((a) => ({
                ...a,
                isRead: true,
            }))
        );

        setUnreadCount(0);

        try {
            await api.patch("/alerts/read-all");
        } catch {
            fetchUnread();
        }
    }, [fetchUnread]);

    const removeAlert = useCallback(
        async (id) => {
            const target = alerts.find(
                (a) => a._id === id
            );

            setAlerts((prev) =>
                prev.filter(
                    (a) => a._id !== id
                )
            );

            if (target && !target.isRead) {
                setUnreadCount((c) =>
                    Math.max(0, c - 1)
                );
            }

            try {
                await api.delete(`/alerts/${id}`);
            } catch {
                fetchUnread();
            }
        },
        [alerts, fetchUnread]
    );

    const clearAll = useCallback(async () => {
        setAlerts([]);
        setUnreadCount(0);
        setHasMore(false);

        try {
            await api.delete("/alerts");
        } catch {
            fetchUnread();
        }
    }, [fetchUnread]);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            setAlerts([]);
            setHasMore(false);

            return undefined;
        }

        fetchUnread();

        const tick = () => {
            if (
                document.visibilityState === "visible"
            ) {
                fetchUnread();
            }
        };

        const interval = setInterval(
            tick,
            POLL_MS
        );

        document.addEventListener(
            "visibilitychange",
            tick
        );

        return () => {
            clearInterval(interval);

            document.removeEventListener(
                "visibilitychange",
                tick
            );
        };
    }, [user, fetchUnread]);

    const value = useMemo(
        () => ({
            alerts,
            unreadCount,
            loading,
            hasMore,
            loadAlerts,
            refresh: fetchUnread,
            markRead,
            markAllRead,
            removeAlert,
            clearAll,
        }),
        [
            alerts,
            unreadCount,
            loading,
            hasMore,
            loadAlerts,
            fetchUnread,
            markRead,
            markAllRead,
            removeAlert,
            clearAll,
        ]
    );

    return (
        <AlertsContext.Provider value={value}>
            {children}
        </AlertsContext.Provider>
    );
}