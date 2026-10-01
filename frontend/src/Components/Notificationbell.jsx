import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    Bell,
    CheckCheck,
    CheckCircle2,
    Info,
    Trash2,
    X,
    XCircle,
} from "lucide-react";
import {useAlerts} from "../context/useAlerts";

const SEVERITY = {
    info: { Icon: Info, tone: "bg-[#f2edff] text-[#5426c7]" },
    success: { Icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
    warning: { Icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
    error: { Icon: XCircle, tone: "bg-red-50 text-red-700" },
};

const timeAgo = (value) => {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export const NotificationBell = () => {
    const navigate = useNavigate();
    const {
        alerts,
        unreadCount,
        loading,
        hasMore,
        loadAlerts,
        markRead,
        markAllRead,
        removeAlert,
        clearAll,
    } = useAlerts();

    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, right: 12 });
    const buttonRef = useRef(null);
    const panelRef = useRef(null);

    // The header has overflow-hidden, so the panel is rendered in a portal
    // and positioned from the bell's on-screen rectangle.
    const place = useCallback(() => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPos({
            top: rect.bottom + 8,
            right: Math.max(12, window.innerWidth - rect.right),
        });
    }, []);

    useLayoutEffect(() => {
        if (!open) return undefined;
        place();
        window.addEventListener("resize", place);
        return () => window.removeEventListener("resize", place);
    }, [open, place]);

    // Fresh list every time the panel opens.
    useEffect(() => {
        if (open) loadAlerts();
    }, [open, loadAlerts]);

    // Close on outside click / Escape.
    useEffect(() => {
        if (!open) return undefined;

        const onPointerDown = (event) => {
            if (
                panelRef.current?.contains(event.target) ||
                buttonRef.current?.contains(event.target)
            ) {
                return;
            }
            setOpen(false);
        };
        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    const openAlert = (alert) => {
        markRead(alert._id);
        if (alert.link) {
            setOpen(false);
            navigate(alert.link);
        }
    };

    const panel = open
        ? createPortal(
            <div
                ref={panelRef}
                role="dialog"
                aria-label="Alerts"
                style={{
                    top: pos.top,
                    right: pos.right,
                    width: "min(380px, calc(100vw - 24px))",
                }}
                className="fixed z-[60] flex max-h-[min(70vh,520px)] flex-col overflow-hidden rounded-2xl border border-[#ebe5ff] bg-(--surface) text-(--text-heading) shadow-[0_12px_40px_rgba(84,38,199,0.18)]"
            >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 border-b border-[#ebe5ff] px-4 py-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[15px] font-bold">Alerts</h2>
                        {unreadCount > 0 && (
                            <span className="rounded-full bg-[#f2edff] px-2 py-0.5 text-[11px] font-semibold text-[#5426c7]">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    <button
                        type="button"
                        aria-label="Close alerts"
                        onClick={() => setOpen(false)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#5426c7] hover:bg-[#f2edff] md:hidden"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* List */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {alerts.length === 0 && !loading && (
                        <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
                            <Bell size={26} className="text-[#a879ff]" strokeWidth={1.6} />
                            <p className="text-sm font-semibold">No alerts yet</p>
                            <p className="text-[13px] opacity-70">
                                Updates about your books, orders and plan will show up here.
                            </p>
                        </div>
                    )}

                    {alerts.length === 0 && loading && (
                        <p className="px-4 py-8 text-center text-sm opacity-70">Loading alerts…</p>
                    )}

                    <ul>
                        {alerts.map((alert) => {
                            const { Icon, tone } = SEVERITY[alert.severity] || SEVERITY.info;
                            return (
                                <li
                                    key={alert._id}
                                    className="group relative flex items-start gap-1 border-b border-[#ebe5ff]/70 last:border-b-0"
                                >
                                    {!alert.isRead && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute left-0 top-0 h-full w-1 bg-[#5426c7]"
                                        />
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => openAlert(alert)}
                                        className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left transition hover:bg-[#f2edff]/60 focus-visible:bg-[#f2edff]/60 focus-visible:outline-none"
                                    >
                                        <span
                                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}
                                        >
                                            <Icon size={16} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span
                                                className={`block text-[14px] leading-snug ${alert.isRead ? "font-medium" : "font-bold"
                                                    }`}
                                            >
                                                {alert.title}
                                            </span>
                                            {alert.message && (
                                                <span className="mt-0.5 block text-[13px] leading-snug opacity-75">
                                                    {alert.message}
                                                </span>
                                            )}
                                            <span className="mt-1 block text-[11px] opacity-55">
                                                {timeAgo(alert.createdAt)}
                                            </span>
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        aria-label={`Delete alert: ${alert.title}`}
                                        onClick={() => removeAlert(alert._id)}
                                        className="mr-2 mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#918aa5] opacity-100 transition hover:bg-red-50 hover:text-red-600 focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>

                    {hasMore && (
                        <div className="p-3 text-center">
                            <button
                                type="button"
                                disabled={loading}
                                onClick={() => loadAlerts({ more: true })}
                                className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-[#5426c7] hover:bg-[#f2edff] disabled:opacity-50"
                            >
                                {loading ? "Loading…" : "Show older alerts"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                {alerts.length > 0 && (
                    <div className="flex items-center justify-between gap-2 border-t border-[#ebe5ff] px-3 py-2">
                        <button
                            type="button"
                            onClick={markAllRead}
                            disabled={unreadCount === 0}
                            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-[#5426c7] hover:bg-[#f2edff] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
                        >
                            <CheckCheck size={15} />
                            Mark all as read
                        </button>
                        <button
                            type="button"
                            onClick={clearAll}
                            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-semibold text-red-600 hover:bg-red-50"
                        >
                            <Trash2 size={14} />
                            Clear all
                        </button>
                    </div>
                )}
            </div>,
            document.body
        )
        : null;

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                aria-label={
                    unreadCount > 0 ? `Alerts, ${unreadCount} unread` : "Alerts"
                }
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => setOpen((v) => !v)}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#5426c7] transition-all duration-200 hover:scale-105 hover:bg-white/70 md:h-11.5 md:w-11.5"
            >
                <Bell size={28} strokeWidth={1.8} className="h-6 w-6 md:h-7 md:w-7" />

                {unreadCount > 0 && (
                    <span className="absolute -right-0.75 -top-1 flex h-4.75 min-w-4.75 items-center justify-center rounded-full bg-[#e94b4b] px-1 text-[10px] font-bold text-white shadow-sm">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>
            {panel}
        </>
    );
};