import { useContext } from "react";
import AuthContext from "../../../context/auth/AuthContext";
import { Navigate } from "react-router-dom";

const Admin = () => {
  const { accessToken, person, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  // Check authentication
  if (!accessToken || !person) {
    return <Navigate to="/login/admin" replace />;
  }

  // Check role
  if (person.role !== "admin") {
    return <Navigate to={`/login/${person.role}`} replace />;
  }

  return (
    <div>
      <h1>Welcome Admin</h1>
      <p>Role: {person.role}</p>
    </div>
  );
};

export default Admin;