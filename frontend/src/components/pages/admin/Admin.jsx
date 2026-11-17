import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../../../context/auth/AuthContext";
import PersonContext from "../../../context/person/PersonContext";

const Admin = () => {
  const { authTokens } = useContext(AuthContext);
  const { person } = useContext(PersonContext);

  const role = person?.role || "admin";
  console.log(`role`, role);

  const token = localStorage.getItem("adminToken") || authTokens?.admin;

  if (!token) {
    return <Navigate to="/login/admin" replace />;
  };

  return (
    <div>
      <h1>Welcome Admin</h1>
    </div>
  );
};

export default Admin; 