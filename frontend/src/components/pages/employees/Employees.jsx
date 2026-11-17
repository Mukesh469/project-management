import { useContext } from "react"
import AuthContext from "../../../context/auth/AuthContext"
import PersonContext from "../../../context/person/PersonContext";
import { Navigate } from "react-router-dom";


const Employees = () => {
  const { authTokens } = useContext(AuthContext);
  const { person } = useContext(PersonContext);

  console.log(person);

  const token = localStorage.getItem("employeeToken") || authTokens?.employee;
  if (!token) {
    return <Navigate to="/login/employee" replace />
  } 

  return (
    <div>Employees</div>
  )
}

export default Employees