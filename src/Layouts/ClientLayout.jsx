import { NavLink } from "react-router-dom";

import {
    Home,
    BookOpen,
    PlusSquare,
    FileText,
    ShoppingBag,
    Settings,
    HelpCircle,
    Bell,
    Mic,
    Send,
} from "lucide-react";

import { Outlet } from "react-router-dom";
import { Header } from "../Components/header";

export function Layout() {
    const menuItems = [
        {
            name: "Home",
            path: "/home",
            icon: Home,
        },
        {
            name: "My Books",
            path: "/books",
            icon: BookOpen,
        },
        {
            name: "Create Book",
            path: "/create",
            icon: PlusSquare,
        },
        {
            name: "Templates",
            path: "/templates",
            icon: FileText,
        },
        {
            name: "Orders",
            path: "/orders",
            icon: ShoppingBag,
        },
        {
            name: "Settings",
            path: "/settings",
            icon: Settings,
        }

    ];

    return (
        // h-screen + overflow-hidden on the root: the page itself never scrolls,
        // only the designated scroll region (<main>) below will.
        <div className="h-screen overflow-hidden  text-[#29204f]">
            <aside className="fixed left-0 top-0 z-30 flex h-screen w-[230px] flex-col border-r border-[#eeeafa] bg-white px-4 py-7">

                {/* Logo */}

                <div className="mb-8 flex items-center gap-2.5 px-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0eaff] text-xl">
                        ⭐
                    </div>

                    <div className="flex flex-col text-[16px] font-extrabold leading-[1.05] text-[#392078]">
                        <span>Wonder</span>
                        <span>Books</span>
                    </div>

                </div>


                {/* Navigation */}

                <nav className="flex flex-1 flex-col overflow-y-auto scrollbar-hide">

                    {/* Main navigation */}

                    <div className="flex flex-col gap-1.5">
                        {menuItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
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
                                    <Icon
                                        size={18}
                                        strokeWidth={2}
                                    />

                                    <span>
                                        {item.name}
                                    </span>
                                </NavLink>
                            );
                        })}

                    </div>


                    {/* Bottom navigation */}

                    <div className="mt-auto flex flex-col gap-1.5">
                        <img src="https://res.cloudinary.com/djdct0pxu/image/upload/c_crop,g_north_west,h_268,w_367,x_1146,y_365/ChatGPT_Image_Sep_2_2026_04_14_01_PM_vmbaj4.png"
                            alt="Help"
                            className="h-[130px] w-full rounded-lg object-cover"
                        />
                    </div>

                </nav>

            </aside>


            <div className="ml-[230px] flex h-screen flex-col">
                <Header />

                <main className="w-full flex-1 min-h-0 overflow-y-auto scrollbar-hide p-1">
                    <Outlet />
                </main>
            </div>

        </div>
    );
}