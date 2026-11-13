import { useState } from "react";
import PersonContext from "./PersonContext";

const PersonState = (props) => {
    const [person, setPerson] = useState(null);
    const [loading, setLoading] = useState(false);

    const host = import.meta.env.VITE_BACKEND_URL

    const getRoleInfo = () => {
        const adminToken = localStorage.getItem("adminToken");
        const managerToken = localStorage.getItem("managerToken");
        const employeeToken = localStorage.getItem("employeeToken");

        if (adminToken) return { role: "admin" };
        if (managerToken) return { role: "manager" };
        if (employeeToken) return { role: "employee" };
        return { role: null };
    };

    const getCurrentPerson = async () => {
        const { role } = getRoleInfo();

        try {
            setLoading(true);

            if (!role) {
                console.warn("No valid role detected.");
                return { success: false, message: "Unauthorized" };
            }

            const headers = { "Content-Type": "application/json" };
            if (role === "admin") headers["auth-token"] = localStorage.getItem("adminToken");
            else if (role === "manager") headers["auth-token"] = localStorage.getItem("managerToken");
            else headers["auth-token"] = localStorage.getItem("employeeToken");

            const response = await fetch(`${host}/api/person/me`, {
                method: "GET",
                headers,
            });

            if (!response.ok) throw new Error(`Failed to fetch current ${role}.`);

            const data = await response.json();
            if (data.success) setPerson(data.person);
        } catch (error) {
            console.error(`Error fetching current ${role}:`, error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <PersonContext.Provider value={{
            person,
            loading,
            getCurrentPerson,
        }}>
            {props.children}
        </PersonContext.Provider>
    )
}

export default PersonState;