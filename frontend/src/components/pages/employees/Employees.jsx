import { useContext } from "react"
import AuthContext from "../../../context/auth/AuthContext"
import PersonContext from "../../../context/person/PersonContext";
import { Navigate } from "react-router-dom";
import Loader from "../../common/Loader";

const Employees = () => {
  const { authTokens } = useContext(AuthContext);
  const { person, loading } = useContext(PersonContext);

  const role = person?.role || "employee";
  const token = localStorage.getItem("employeeToken") || authTokens?.employee;

  if (!token) {
    return <Navigate to={"/login/employee"} replace />
  }

  if (loading && !person) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Loader />
      </div>
    );
  }

  return (
    <div>role: {role}</div>
  )
}

export default Employees