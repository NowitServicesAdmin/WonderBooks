import { NavLink, Outlet } from "react-router-dom";

import {
    Home,
    BookOpen,
    PlusSquare,
    FileText,
    ShoppingBag,
    Settings,
    Users,
    CreditCard,
    BarChart2,
} from "lucide-react";

import { Header } from "../Components/header";

export function Layout({ header = true, superadmin = false }) {
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
            <aside className="fixed left-0 top-0 z-40 flex h-screen w-[230px] flex-col border-r border-[#eeeafa] bg-white px-4 py-7">

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
                                        ${
                                            isActive
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

                    {/* Bottom Image */}
                    <div className="mt-auto pt-6">
                        <img
                            src="https://res.cloudinary.com/djdct0pxu/image/upload/c_crop,g_north_west,h_268,w_367,x_1146,y_365/ChatGPT_Image_Sep_2_2026_04_14_01_PM_vmbaj4.png"
                            alt="Help"
                            className="h-[130px] w-full rounded-lg object-cover"
                        />
                    </div>

                </nav>
            </aside>


            {/* ================= MAIN AREA ================= */}
            <div className="ml-[230px] flex h-screen flex-col overflow-hidden">

                {/* Fixed Header */}
                {header && (
                    <div className="z-30 flex-none bg-white">
                        <Header superadmin={superadmin} />
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