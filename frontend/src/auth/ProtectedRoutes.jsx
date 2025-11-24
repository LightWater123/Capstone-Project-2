import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import GlobalSpinner from "@/components/loader";

export default function ProtectedRoutes({redirectPath}){
    const {user} = useAuth()
    if (user === null) {
        return <Navigate to={redirectPath} replace />;
    } else if (user === undefined) {
        return <GlobalSpinner />
    }

  return <Outlet />;
}