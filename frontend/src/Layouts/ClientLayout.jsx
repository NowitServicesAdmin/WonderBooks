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

        {/* Logout */}
        <button
            type="button"
            onClick={handleLogout}
            className="mt-2 flex h-11 items-center gap-3 rounded-[10px] px-3.5 text-sm font-semibold text-[#70698a] transition-all duration-200 hover:bg-[#fdeeee] hover:text-[#e94b4b]"
        >
            <LogOut size={18} strokeWidth={2} />
            <span>Log out</span>
        </button>

        {/* Animated Wonder Book */}
       {/* Animated Wonder Book */}
<div className="mt-auto flex justify-center pt-6">
    <div className="relative h-38.75 w-full">

        {/* Soft book shadow */}
        <div
            className="
                absolute
                bottom-2
                left-1/2
                h-4.5
                w-46.25
                -translate-x-1/2
                rounded-full
                bg-[#5426c7]/15
                blur-md
            "
        />

        {/* Original book */}
        <img
            src="https://res.cloudinary.com/djdct0pxu/image/upload/c_crop,g_north_west,h_268,w_367,x_1146,y_365/ChatGPT_Image_Sep_2_2026_04_14_01_PM_vmbaj4.png"
            alt="Wonder Book"
            className="
                absolute
                bottom-0
                left-1/2
                z-10
                h-36.25
                w-full
                -translate-x-1/2
                select-none
                object-contain
            "
        />

        {/* RIGHT PAGE FLIP */}
        <div
            className="
                pointer-events-none
                absolute
                bottom-4.75
                left-1/2
                z-20
                h-16.75
                w-22.75
                origin-left
                animate-real-page-flip
            "
            style={{
                perspective: "900px",
                transformStyle: "preserve-3d",
            }}
        >
            {/* Page */}
            <div
                className="
                    absolute
                    inset-0
                    overflow-hidden
                    bg-[#fffdf9]
                    shadow-[-3px_2px_6px_rgba(70,35,130,0.16)]
                "
                style={{
                    clipPath:
                        "polygon(0 4%, 100% 0, 96% 82%, 48% 100%, 0 84%)",
                    backfaceVisibility: "hidden",
                }}
            >
                {/* Page lines */}
                <div className="absolute inset-1.75 opacity-40">
                    <div className="mb-1.25 h-px w-[78%] bg-[#c9b9df]" />
                    <div className="mb-1.25 h-px w-[88%] bg-[#c9b9df]" />
                    <div className="mb-1.25 h-px w-[70%] bg-[#c9b9df]" />
                    <div className="mb-1.25 h-px w-[82%] bg-[#c9b9df]" />
                    <div className="h-px w-[60%] bg-[#c9b9df]" />
                </div>

                {/* Page highlight */}
                <div
                    className="
                        absolute
                        right-0
                        top-0
                        h-full
                        w-4.5
                        bg-linear-to-l
                        from-white/70
                        to-transparent
                    "
                />
            </div>
        </div>

        {/* Spine highlight */}
        <div
            className="
                absolute
                bottom-4.5
                left-1/2
                z-30
                h-14.5
                w-0.75
                -translate-x-1/2
                rounded-full
                bg-[#d6c0ef]/70
                blur-[1px]
            "
        />

        {/* Sparkles */}
        <span
            className="
                absolute
                left-7.5
                top-9.5
                z-30
                animate-sparkle-one
                text-[14px]
            "
        >
            ✨
        </span>

        <span
            className="
                absolute
                right-7.25
                top-10.5
                z-30
                animate-sparkle-two
                text-[12px]
            "
        >
            ✨
        </span>

        <span
            className="
                absolute
                left-13.5
                top-5
                z-30
                animate-sparkle-three
                text-[11px]
            "
        >
            ⭐
        </span>
    </div>
</div>

    </nav>

    {/* Animation styles */}
    <style>
        {`
            @keyframes pageFlip {
                0% {
                    transform: perspective(500px) rotateY(0deg);
                    opacity: 0;
                }

                15% {
                    opacity: 0.8;
                }

                40% {
                    transform: perspective(500px) rotateY(-75deg);
                    opacity: 0.65;
                }

                55% {
                    transform: perspective(500px) rotateY(-145deg);
                    opacity: 0.35;
                }

                70% {
                    transform: perspective(500px) rotateY(-180deg);
                    opacity: 0;
                }

                100% {
                    transform: perspective(500px) rotateY(-180deg);
                    opacity: 0;
                }
            }

            @keyframes bookGlow {
                0%,
                100% {
                    transform: translateX(-50%) scale(0.9);
                    opacity: 0.35;
                }

                50% {
                    transform: translateX(-50%) scale(1.05);
                    opacity: 0.7;
                }
            }

            @keyframes sparkleOne {
                0%,
                100% {
                    opacity: 0;
                    transform: translateY(5px) scale(0.7);
                }

                40% {
                    opacity: 1;
                    transform: translateY(-3px) scale(1);
                }

                70% {
                    opacity: 0;
                    transform: translateY(-10px) scale(0.8);
                }
            }

            @keyframes sparkleTwo {
                0%,
                100% {
                    opacity: 0;
                    transform: translateY(4px) scale(0.7);
                }

                50% {
                    opacity: 1;
                    transform: translateY(-5px) scale(1.1);
                }

                80% {
                    opacity: 0;
                    transform: translateY(-12px) scale(0.8);
                }
            }

            @keyframes sparkleThree {
                0%,
                100% {
                    opacity: 0.2;
                    transform: rotate(0deg) scale(0.7);
                }

                50% {
                    opacity: 1;
                    transform: rotate(20deg) scale(1.15);
                }
            }

            .animate-page-flip {
                animation: pageFlip 4.5s ease-in-out infinite;
                transform-style: preserve-3d;
                backface-visibility: hidden;
            }

            .animate-book-glow {
                animation: bookGlow 3.5s ease-in-out infinite;
            }

            .animate-sparkle-one {
                animation: sparkleOne 3.5s ease-in-out infinite;
            }

            .animate-sparkle-two {
                animation: sparkleTwo 4s ease-in-out 1s infinite;
            }

            .animate-sparkle-three {
                animation: sparkleThree 3s ease-in-out 0.5s infinite;
            }
        `}
    </style>
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