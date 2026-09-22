import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
    Home,
    BookOpen,
    PlusSquare,
    FileText,
    ShoppingBag,
    Settings,
    Users,
    CreditCard,
    LogOut,
    X,
    PanelLeftOpen,
    ChevronLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const menuItems = [
    { name: "Home", path: "/home", icon: Home },
    { name: "My Books", path: "/books", icon: BookOpen },
    { name: "Create Book", path: "/create", icon: PlusSquare },
    { name: "Templates", path: "/templates", icon: FileText },
    { name: "Orders", path: "/orders", icon: ShoppingBag },
    { name: "Settings", path: "/settings", icon: Settings },
];

const superadminMenu = [
    { name: "Dashboard", path: "/superadmin", icon: Home },
    { name: "Users", path: "/superadmin/users", icon: Users },
    { name: "Books", path: "/superadmin/books", icon: BookOpen },
    { name: "Orders", path: "/superadmin/orders", icon: ShoppingBag },
    { name: "Subscriptions", path: "/superadmin/subscriptions", icon: CreditCard },
];

export function SideNav({
    superadmin = false,
    onLogout,
    mobileMenuOpen = false,
    setMobileMenuOpen = () => { },
}) {
    // Desktop collapse state (icons only vs. icons + labels)
    const [isOpen, setIsOpen] = useState(true);
    const { user } = useAuth();

    const activeMenu = superadmin ? superadminMenu : menuItems;

    // The mobile drawer should always show full labels regardless of
    // whatever collapse state was left over from desktop.
    const expanded = isOpen || mobileMenuOpen;

    const displayName = user?.name || user?.email?.split("@")[0] || "User";
    const avatarUrl = user?.profileImage || user?.avatar;

    return (
        <>
            {/* Mobile backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Wrapper: positions the sidebar and lets the toggle sit on its border */}
            <div
                className={`
                    fixed left-0 top-0 z-50 h-screen shrink-0
                    transition-all duration-300 ease-in-out
                    md:relative
                    ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                    w-[78vw] max-w-70
                    ${isOpen ? "md:w-57.5" : "md:w-24"}
                `}
            >
                {/* Desktop collapse arrow on the border line (only while open;
                    when collapsed, the logo icon is used to expand) */}
                {isOpen && (
                    <button
                        type="button"
                        aria-label="Collapse sidebar"
                        onClick={() => setIsOpen(false)}
                        className="absolute -right-3 top-7 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-[#e3dbfa] bg-white text-[#5426c7] shadow-[0_2px_8px_rgba(84,38,199,0.15)] transition-all duration-200 hover:scale-110 hover:bg-[#5426c7] hover:text-white active:scale-95 md:flex"
                    >
                        <ChevronLeft size={14} strokeWidth={2.5} />
                    </button>
                )}

            <aside className="flex h-full w-full flex-col overflow-hidden border-r border-[#eeeafa] bg-white">
                {/* Header */}
                <div className="relative flex h-20 items-center border-b border-[#eeeafa] px-3">
                    {/* Mobile close */}
                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={() => setMobileMenuOpen(false)}
                        className="absolute right-3 top-4 rounded-lg p-1.5 text-[#70698a] transition-all hover:bg-[#f5f1ff] active:scale-95 md:hidden"
                    >
                        <X size={20} />
                    </button>

                    {/* Logo (click to expand when collapsed) */}
                    <div
                        className={`flex items-center justify-center ${expanded ? "w-12" : "flex-1"}`}
                    >
                        <button
                            type="button"
                            aria-label={expanded ? "Wonder Books" : "Expand sidebar"}
                            onClick={() => {
                                if (!isOpen) setIsOpen(true);
                            }}
                            className="group relative flex items-center justify-center"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0eaff] text-xl transition-transform duration-300 group-hover:scale-105">
                                ⭐
                            </div>

                            {!expanded && (
                                <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#f0eaff] text-[#5426c7] opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                    <PanelLeftOpen size={18} />
                                </span>
                            )}
                        </button>
                    </div>

                    {expanded && (
                        <div className="ml-2 flex min-w-0 flex-col text-[16px] font-extrabold leading-[1.05] text-[#392078]">
                            <span className="truncate">Wonder Books</span>

                            {superadmin && (
                                <span className="truncate text-xs font-semibold text-[#70698a]">
                                    Super Admin
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-3 scrollbar-hide sm:p-4">
                    {activeMenu.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.path === "/superadmin"}
                                title={!expanded ? item.name : undefined}
                                onClick={() => {
                                    if (window.innerWidth < 768) setMobileMenuOpen(false);
                                }}
                                className={({ isActive }) =>
                                    `flex h-11 items-center rounded-[10px] text-sm font-semibold transition-all duration-200 ${
                                        expanded ? "gap-3 px-3.5" : "justify-center px-2"
                                    } ${
                                        isActive
                                            ? "bg-[#5426c7] text-white shadow-[0_5px_12px_rgba(84,38,199,0.20)]"
                                            : "text-[#70698a] hover:bg-[#f5f1ff] hover:text-[#5426c7]"
                                    }`
                                }
                            >
                                <Icon size={18} strokeWidth={2} className="shrink-0" />
                                {expanded && <span className="truncate">{item.name}</span>}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User info */}
                {expanded && (
                    <div className="px-3 py-3 sm:px-4">
                        <div className="flex items-center gap-3 rounded-2xl bg-[#f5f1ff] p-2.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#cfe8c1]">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={displayName}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="font-semibold text-[#33502a]">
                                        {displayName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>

                            <div className="min-w-0 flex-1 leading-tight">
                                <p className="truncate text-sm font-semibold text-[#29204f]">
                                    {displayName}
                                </p>
                                <p className="truncate text-xs text-[#70698a]">
                                    {superadmin ? "Super Admin" : "Parent"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Logout */}
                <div className="p-3 pt-0 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4 sm:pt-0">
                    <button
                        type="button"
                        onClick={onLogout}
                        title={!expanded ? "Log out" : undefined}
                        className={`flex h-11 w-full items-center rounded-[10px] text-sm font-semibold text-[#70698a] transition-all duration-200 hover:bg-[#fdeeee] hover:text-[#e94b4b] active:scale-[0.98] ${
                            expanded ? "gap-3 px-3.5" : "justify-center"
                        }`}
                    >
                        <LogOut size={18} strokeWidth={2} className="shrink-0" />
                        {expanded && <span>Log out</span>}
                    </button>
                </div>
            </aside>
            </div>
        </>
    );
}

export default SideNav;