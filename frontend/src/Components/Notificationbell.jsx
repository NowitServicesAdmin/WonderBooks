import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
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
import { useAlerts } from "../context/useAlerts";

const SEVERITY = {
    info: { Icon: Info, tone: "bg-[#f2edff] text-[#5426c7]" },
    success: { Icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
    warning: { Icon: AlertTriangle, tone: "bg-amber-50 text-amber-700" },
    error: { Icon: XCircle, tone: "bg-red-50 text-red-700" },
};

const timeAgo = (value) => {
    const seconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(value).getTime()) / 1000)
    );

    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    });
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

    const [pos, setPos] = useState({
        top: 0,
        left: undefined,
        right: 12,
        width: "min(380px, calc(100vw - 24px))",
        maxHeight: "min(520px, 70vh)",
    });

    const buttonRef = useRef(null);
    const panelRef = useRef(null);

    // Responsive positioning for mobile, tablet and desktop.
    const place = useCallback(() => {
        const rect = buttonRef.current?.getBoundingClientRect();

        if (!rect) return;

        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight =
            window.visualViewport?.height ?? window.innerHeight;

        const isMobile = viewportWidth < 640;
        const top = rect.bottom + 8;

        if (isMobile) {
            // Keep equal margins on both sides of the mobile screen.
            const availableHeight = Math.max(
                160,
                viewportHeight - top - 12
            );

            setPos({
                top,
                left: 12,
                right: undefined,
                width: "calc(100vw - 24px)",
                maxHeight: `min(${availableHeight}px, calc(100dvh - ${top}px - 12px))`,
            });

            return;
        }

        // Align the desktop panel with the notification bell.
        setPos({
            top,
            left: undefined,
            right: Math.max(12, viewportWidth - rect.right),
            width: "min(380px, calc(100vw - 24px))",
            maxHeight: "min(520px, 70vh)",
        });
    }, []);

    // Recalculate panel position when the viewport changes.
    useLayoutEffect(() => {
        if (!open) return undefined;

        place();

        window.addEventListener("resize", place);
        window.addEventListener("orientationchange", place);
        window.visualViewport?.addEventListener("resize", place);
        window.visualViewport?.addEventListener("scroll", place);

        return () => {
            window.removeEventListener("resize", place);
            window.removeEventListener("orientationchange", place);
            window.visualViewport?.removeEventListener("resize", place);
            window.visualViewport?.removeEventListener("scroll", place);
        };
    }, [open, place]);

    // Fetch alerts whenever the panel opens.
    useEffect(() => {
        if (open) {
            loadAlerts();
        }
    }, [open, loadAlerts]);

    // Close the panel when clicking outside or pressing Escape.
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

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    const togglePanel = () => {
        if (!open) {
            place();
        }

        setOpen((previous) => !previous);
    };

    // Mark an alert as read and navigate if it has a destination.
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
                  aria-modal="false"
                  style={{
                      top: pos.top,
                      left: pos.left,
                      right: pos.right,
                      width: pos.width,
                      maxHeight: pos.maxHeight,
                  }}
                  className="fixed z-[60] flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#ebe5ff] bg-(--surface) text-(--text-heading) shadow-[0_12px_40px_rgba(84,38,199,0.18)]"
              >
                  {/* Header */}
                  <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#ebe5ff] px-4 py-3 sm:px-5">
                      <div className="flex min-w-0 items-center gap-2">
                          <h2 className="text-[15px] font-bold">
                              Alerts
                          </h2>

                          {unreadCount > 0 && (
                              <span className="rounded-full bg-[#f2edff] px-2 py-0.5 text-[11px] font-semibold text-[#5426c7]">
                                  {unreadCount} new
                              </span>
                          )}
                      </div>

                      {/* Close button for mobile */}
                      <button
                          type="button"
                          aria-label="Close alerts"
                          onClick={() => setOpen(false)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#5426c7] transition hover:bg-[#f2edff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a879ff] sm:hidden"
                      >
                          <X size={17} />
                      </button>
                  </div>

                  {/* Scrollable alerts list */}
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                      {/* Empty state */}
                      {alerts.length === 0 && !loading && (
                          <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-5 py-8 text-center sm:min-h-52 sm:px-6">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f2edff]">
                                  <Bell
                                      size={24}
                                      className="text-[#a879ff]"
                                      strokeWidth={1.6}
                                  />
                              </div>

                              <p className="text-sm font-semibold sm:text-base">
                                  No alerts yet
                              </p>

                              <p className="max-w-[260px] text-xs leading-5 opacity-70 sm:text-[13px]">
                                  Updates about your books, orders and plan
                                  will show up here.
                              </p>
                          </div>
                      )}

                      {/* Loading state */}
                      {alerts.length === 0 && loading && (
                          <p className="px-4 py-8 text-center text-sm opacity-70">
                              Loading alerts…
                          </p>
                      )}

                      {/* Alert items */}
                      <ul>
                          {alerts.map((alert) => {
                              const { Icon, tone } =
                                  SEVERITY[alert.severity] || SEVERITY.info;

                              return (
                                  <li
                                      key={alert._id}
                                      className="group relative flex min-w-0 items-start gap-1 border-b border-[#ebe5ff]/70 last:border-b-0"
                                  >
                                      {!alert.isRead && (
                                          <span
                                              aria-hidden="true"
                                              className="absolute left-0 top-0 h-full w-1 bg-[#5426c7]"
                                          />
                                      )}

                                      {/* Alert details */}
                                      <button
                                          type="button"
                                          onClick={() => openAlert(alert)}
                                          className="flex min-w-0 flex-1 items-start gap-3 px-3 py-3 text-left transition hover:bg-[#f2edff]/60 focus-visible:bg-[#f2edff]/60 focus-visible:outline-none sm:px-4"
                                      >
                                          <span
                                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tone}`}
                                          >
                                              <Icon size={16} />
                                          </span>

                                          <span className="min-w-0 flex-1 break-words">
                                              <span
                                                  className={`block break-words text-[14px] leading-snug ${
                                                      alert.isRead
                                                          ? "font-medium"
                                                          : "font-bold"
                                                  }`}
                                              >
                                                  {alert.title}
                                              </span>

                                              {alert.message && (
                                                  <span className="mt-0.5 block break-words text-[13px] leading-snug opacity-75">
                                                      {alert.message}
                                                  </span>
                                              )}

                                              <span className="mt-1 block text-[11px] opacity-55">
                                                  {timeAgo(alert.createdAt)}
                                              </span>
                                          </span>
                                      </button>

                                      {/* Delete alert */}
                                      <button
                                          type="button"
                                          aria-label={`Delete alert: ${alert.title}`}
                                          onClick={() =>
                                              removeAlert(alert._id)
                                          }
                                          className="mr-2 mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#918aa5] transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 md:opacity-0 md:group-hover:opacity-100"
                                      >
                                          <Trash2 size={14} />
                                      </button>
                                  </li>
                              );
                          })}
                      </ul>

                      {/* Load older alerts */}
                      {hasMore && (
                          <div className="p-3 text-center">
                              <button
                                  type="button"
                                  disabled={loading}
                                  onClick={() => loadAlerts({ more: true })}
                                  className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[#5426c7] hover:bg-[#f2edff] disabled:opacity-50"
                              >
                                  {loading
                                      ? "Loading…"
                                      : "Show older alerts"}
                              </button>
                          </div>
                      )}
                  </div>

                  {/* Footer actions */}
                  {alerts.length > 0 && (
                      <div className="flex shrink-0 flex-wrap items-center justify-between gap-1 border-t border-[#ebe5ff] px-2 py-2 sm:px-3">
                          <button
                              type="button"
                              onClick={markAllRead}
                              disabled={unreadCount === 0}
                              className="flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-[#5426c7] hover:bg-[#f2edff] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent sm:text-[13px]"
                          >
                              <CheckCheck
                                  size={15}
                                  className="shrink-0"
                              />
                              <span>Mark all as read</span>
                          </button>

                          <button
                              type="button"
                              onClick={clearAll}
                              className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 sm:text-[13px]"
                          >
                              <Trash2
                                  size={14}
                                  className="shrink-0"
                              />
                              <span>Clear all</span>
                          </button>
                      </div>
                  )}
              </div>,
              document.body
          )
        : null;

    return (
        <>
            {/* Notification bell */}
            <button
                ref={buttonRef}
                type="button"
                aria-label={
                    unreadCount > 0
                        ? `Alerts, ${unreadCount} unread`
                        : "Alerts"
                }
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={togglePanel}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#5426c7] transition-all duration-200 hover:scale-105 hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a879ff] md:h-11.5 md:w-11.5"
            >
                <Bell
                    size={28}
                    strokeWidth={1.8}
                    className="h-6 w-6 md:h-7 md:w-7"
                />

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

export default NotificationBell;