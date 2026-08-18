import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { getSessionKind } from "../lib/session";

interface ProtectedRouteProps {
    children: ReactElement;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
    if (getSessionKind() === "none") {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
