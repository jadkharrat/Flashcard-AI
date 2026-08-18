import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { getSessionKind } from "../lib/session";

interface PublicRouteProps {
    children: ReactElement;
}

function PublicRoute({ children }: PublicRouteProps) {
    if (getSessionKind() !== "none") {
        return <Navigate to="/home" replace />;
    }

    return children;
}

export default PublicRoute;
