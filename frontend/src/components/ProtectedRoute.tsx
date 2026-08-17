import React, { type JSX } from "react";
import { Navigate } from "react-router-dom";

interface Props {
    children: JSX.Element;
}

const ProtectedRoute: React.FC<Props> = ({ children }) => {
    const token = localStorage.getItem("token");
    const demoMode = sessionStorage.getItem("demoMode");

    if (!token && !demoMode) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
