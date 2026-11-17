import { useNavigate } from "react-router-dom"

const LandingPage = () => {
    const navigate = useNavigate();

    const ROLES = [
        { label: "Admin", path: "/login/admin" },
        { label: "Manager", path: "/login/manager" },
        { label: "Employee", path: "/login/employee" }
    ]
    
    return (
        <div className="min-h-screen flex flex-col gap-4 items-center  justify-center ">
            <p className="text-3xl uppercase bold text-gray-800">Welcome to the project management system</p>
            <div className="flex gap-2">
                {ROLES.map((role) => {
                    return (
                        <button className="px-5 py-2 rounded-xl border border-gray-200  bg-white text-gray-700 font-medium  shadow-sm hover:bg-blue-50 hover:text-blue-600  hover:border-blue-400 hover:shadow-md active:scale-95 transition-all duration-200"
                            onClick={() => navigate(`${role.path}`)}
                        >
                            {role.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default LandingPage