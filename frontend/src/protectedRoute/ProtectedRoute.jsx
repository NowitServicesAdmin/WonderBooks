/* eslint-disable react-refresh/only-export-components */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const isSuperAdmin = (user) => user?.role === "super admin";
const homeFor = (user) => (isSuperAdmin(user) ? "/superadmin" : "/home");

const Spinner = () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#faf9ff]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#ece5ff] border-t-[#5426c7]" />
    </div>
);

export const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <Spinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    return <Outlet />;
};

export const RoleRoute = ({ role }) => {
    const { user } = useAuth();

    if (role === "super admin" && !isSuperAdmin(user)) {
        return <Navigate to={homeFor(user)} replace />;
    }

    if (role === "user" && isSuperAdmin(user)) {
        return <Navigate to={homeFor(user)} replace />;
    }

    return <Outlet />;
};

export const RoleHomeRedirect = () => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) {
        return <Spinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/auth" replace />;
    }

    return <Navigate to={homeFor(user)} replace />;
};

export { homeFor };