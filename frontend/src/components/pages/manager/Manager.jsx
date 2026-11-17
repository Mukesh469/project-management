import { useContext } from "react";
import AuthContext from "../../../context/auth/AuthContext";
import { Navigate } from "react-router-dom";

const Manager = () => {
  const { authTokens } = useContext(AuthContext);
  const token = localStorage.getItem("managerToken") || authTokens?.vendor;

  if (!token) {
    return <Navigate to="/login/manager" replace />
  }
  
  return (
    <div>Manager</div>
  )
}

export default Manager