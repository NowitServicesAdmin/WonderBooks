import { NavLink, Outlet, useNavigate } from "react-router-dom";

import {
    Home,
    BookOpen,
    PlusSquare,
    FileText,
    ShoppingBag,
    Settings,
    Users,
    CreditCard,
    // BarChart2,
    LogOut,
} from "lucide-react";

import { Header } from "../Components/header";
import { useAuth } from "../context/AuthContext";

export function Layout({ header = true, superadmin = false }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/auth", { replace: true });
    };

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
        // { name: "Payments", path: "/superadmin/payments", icon: CreditCard },
        // { name: "Reports", path: "/superadmin/reports", icon: BarChart2 },
        // { name: "Settings", path: "/superadmin/settings", icon: Settings },
    ];

    const activeMenu = superadmin ? superadminMenu : menuItems;

    return (
        <div className="h-screen overflow-hidden text-[#29204f]">

            {/* ================= SIDEBAR ================= */}
            <aside className="fixed left-0 top-0 z-40 flex h-screen w-57.5 flex-col border-r border-[#eeeafa] bg-white px-4 py-7">
                {/* Logo */}
                <div className="mb-8 flex items-center gap-2.5 px-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0eaff] text-xl">
                        ⭐
                    </div>

                    <div className="flex flex-col text-[16px] font-extrabold leading-[1.05] text-[#392078]">
                        <span>Wonder Books</span>

                        {superadmin && (
                            <span className="text-xs font-semibold text-[#70698a]">
                                Super Admin
                            </span>
                        )}
                    </div>
                </div>
                {/* Navigation */}
                <nav className="flex min-h-0 flex-1 flex-col">
                    {/* Main Navigation */}
                    <div className="flex flex-col gap-1.5">
                        {activeMenu.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    end={item.path === "/superadmin"}
                                    className={({ isActive }) =>
                                        `
                            flex h-11 items-center gap-3 rounded-[10px]
                            px-3.5 text-sm font-semibold
                            transition-all duration-200
                            ${isActive
                                            ? "bg-[#5426c7] text-white shadow-[0_5px_12px_rgba(84,38,199,0.20)]"
                                            : "text-[#70698a] hover:bg-[#f5f1ff] hover:text-[#5426c7]"
                                        }
                            `
                                    }
                                >
                                    <Icon size={18} strokeWidth={2} />
                                    <span>{item.name}</span>
                                </NavLink>
                            );
                        })}
                    </div>

                    {/* Logout */}
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-2 flex h-11 items-center gap-3 rounded-[10px] px-3.5 text-sm font-semibold text-[#70698a] transition-all duration-200 hover:bg-[#fdeeee] hover:text-[#e94b4b]"
                    >
                        <LogOut size={18} strokeWidth={2} />
                        <span>Log out</span>
                    </button>

                </nav>
            </aside>


            {/* ================= MAIN AREA ================= */}
            <div className="ml-57.5 flex h-screen flex-col overflow-hidden">

                {/* Fixed Header */}
                {header && (
                    <div className="z-30 flex-none bg-white">
                        <Header
                            superadmin={superadmin}
                            userName={user?.name || user?.email?.split("@")[0] || "there"}
                        />
                    </div>
                )}

                {/* ONLY THIS AREA SCROLLS */}
                <main
                    className="
                        min-h-0
                        flex-1
                        overflow-y-auto
                        overflow-x-hidden
                        scrollbar-hide
                    "
                >
                    <Outlet />
                </main>

            </div>
        </div>
    );
}