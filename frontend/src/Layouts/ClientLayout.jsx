import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Header } from "../Components/header";
import { SideNav } from "../Components/SideNav";
import { useAuth } from "../context/AuthContext";
import { SubscriptionProvider } from "../context/SubscriptionContext";
import WonderAlertModal from "../Components/WonderAlertModal";

export function Layout({ header = true, superadmin = false }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showLogoutAlert, setShowLogoutAlert] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        setMobileMenuOpen(false);
        setShowLogoutAlert(true);
    };

    const handleConfirmLogout = () => {
        setShowLogoutAlert(false);
        logout();
        navigate("/auth", { replace: true });
    };

    return (
        <SubscriptionProvider enabled={!superadmin}>
            <div className="flex h-screen overflow-hidden text-[var(--text-heading)]">
                {/* ================= SIDEBAR ================= */}
                <SideNav
                    superadmin={superadmin}
                    onLogout={handleLogout}
                    mobileMenuOpen={mobileMenuOpen}
                    setMobileMenuOpen={setMobileMenuOpen}
                />

                {/* ================= MAIN AREA ================= */}
                <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
                    {/* Mobile menu button (works with or without the header) */}
                    <button
                        type="button"
                        aria-label="Open menu"
                        onClick={() => setMobileMenuOpen(true)}
                        className="fixed left-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--tint)] bg-[var(--surface)] text-[var(--accent)] shadow-md transition-all active:scale-95 md:hidden"
                    >
                        <Menu size={20} />
                    </button>

                    {/* Fixed Header */}
                    {header && (
                        <div className="z-20 flex-none bg-[var(--surface)]">
                            <Header
                                superadmin={superadmin}
                                userName={user?.name || user?.email?.split("@")[0] || "there"}
                            />
                        </div>
                    )}

                    {/* ONLY THIS AREA SCROLLS */}
                    <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                        <Outlet />
                    </main>
                </div>
            </div>

            {/* ================= LOGOUT ALERT ================= */}
            <WonderAlertModal
                isOpen={showLogoutAlert}
                onClose={() => setShowLogoutAlert(false)}
                type="logout"
                title="Goodbye for now?"
                message="Are you sure you want to log out? We'll be here when you return for more stories!"
                quote="Take a break, new adventures await!"
                primaryText="Log out"
                secondaryText="Stay"
                onPrimary={handleConfirmLogout}
                onSecondary={() => setShowLogoutAlert(false)}
            />
        </SubscriptionProvider>
    );
}