import { useContext, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthContext from "../../../context/auth/AuthContext";
// import AuthSiderImg from "../../../assets/auth-side-bg.png";
import InputField from "../InputField";
import { toast } from "react-toastify";

const Login = ({ loginRole }) => {
    const { login, logout, loading } = useContext(AuthContext);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const redirectPath = searchParams.get("redirect") || "/";
    const [form, setForm] = useState({ email: "", password: "" });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRoleValidationAndToast = async (result) => {
        if (loginRole !== result.role) {
            toast.error("Invalid role. Please login through the correct portal.");
            await logout();
            return false;
        } else {
            toast.success(result.message);
            return true;
        }
    };

    const handleRoleAndNavigate = (role) => {
        if (role === "admin") {
            navigate("/admin/", { replace: true });
        }
        else if (role === "manager") {
            navigate("/manager/", { replace: true });
        }
        else {
            navigate(redirectPath, { replace: true });
        }

        return true;
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        const result = await login(form.email, form.password, loginRole);
        if (result.success) {
            if (!handleRoleValidationAndToast(result)) return;
            setTimeout(() => handleRoleAndNavigate(result.role), 500);
        } else {
            toast.error(result.message || "Login failed");
        }
    };

    const formValid = form.email.trim() && form.password.trim();

    return (
        <section className="w-full bg-white min-h-screen  flex items-center justify-between gap-10">
            <div className="w-full h-full  px-4 flex flex-col items-center gap-2 lg:gap-4">
                <div className="w-full max-w-lg p-6">
                    <h2 className="text-2xl lg:text-4xl font-bold">
                        {loginRole === "admin"
                            ? "Welcome, Administrator!"
                            : loginRole === "manager"
                                ? "Welcome, Manager!"
                                : "Welcome, Employee!"}
                    </h2>

                    <p className="text-base lg:text-lg font-semibold mt-3 text-gray-500">
                        {loginRole === "admin"
                            ? "Sign in to manage your organization and oversee operations."
                            : loginRole === "manager"
                                ? "Sign in to manage your team, track progress, and stay on top of tasks."
                                : "Sign in to access your workspace and stay connected with your team."}
                    </p>
                </div>

                <div className="w-full max-w-lg">
                    <form
                        onSubmit={handleLoginSubmit}
                        className="w-full p-6 space-y-4"
                    >
                        {/* Toast notifications will show errors/success, so no errorMsg display needed */}

                        <InputField
                            name="email"
                            label="Email"
                            type="email"
                            placeholder="abc@example.com"
                            title="Enter your email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />

                        <InputField
                            name="password"
                            label="Password"
                            type="password"
                            placeholder="******"
                            title="Enter a strong password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />

                        <button
                            type="submit"
                            disabled={loading || !formValid}
                            className={`w-full bg-blue-600 text-white py-2.5 text-base md:text-lg rounded-xl mt-5 transition ${(!formValid || loading) ? "opacity-60 cursor-not-allowed" : "hover:bg-blue-700 cursor-pointer"}`}
                        >
                            {loading ? <div className="font-semibold">Logging in...</div> : <div className="font-semibold">Login</div>}
                        </button>
                        {loginRole === 'employee' ? (<button className="hover:text-blue-500" onClick={() => navigate("/login/manager")}>login as manager</button>) : (<button className="hover:text-blue-500" onClick={() => navigate("/login/employee")}>login as employee</button>)}

                    </form>

                </div>
            </div>

            {/* <div className="w-[55%] h-full hidden lg:flex justify-center items-center p-10">
                <img
                    src={AuthSiderImg}
                    alt="Login Illustration"
                    className="w-[840px] h-[655px] rounded-3xl"
                />
            </div> */}
        </section>
    );
};

export default Login; 