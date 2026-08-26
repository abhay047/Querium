import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router";
import { useAuth } from "../hook/useAuth";
import { useSelector, useDispatch } from "react-redux";
import { setError } from "../auth.slice";
import { useTheme } from "../../../hooks/useTheme";

const Login = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotSuccess, setForgotSuccess] = useState("");
    const [forgotError, setForgotError] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);

    const dispatch = useDispatch();
    const { isDarkMode, toggleTheme } = useTheme();

    const user = useSelector((state) => state.auth.user);
    const loading = useSelector((state) => state.auth.loading);
    const error = useSelector((state) => state.auth.error);

    const { handleLogin, handleForgotPassword } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(setError(null));
    }, [dispatch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (error) dispatch(setError(null));
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await handleLogin(formData);
            navigate("/");
        } catch (err) {
            // Error is handled via Redux state
        }
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setForgotError("");
        setForgotSuccess("");
        setForgotLoading(true);
        try {
            const res = await handleForgotPassword({ email: forgotEmail });
            setForgotSuccess(res?.message || "Password reset link sent to your email!");
        } catch (err) {
            setForgotError(err.response?.data?.message || "Failed to send reset link");
        } finally {
            setForgotLoading(false);
        }
    };

    if (!loading && user) {
        return <Navigate to="/" replace />;
    }

    return (
        <div
            className={`flex min-h-screen w-full flex-col justify-between transition-colors duration-200 ${
                isDarkMode
                    ? "bg-slate-950 text-slate-100"
                    : "bg-[#f7f8f6] text-[#20231f]"
            }`}
        >
            <nav
                className={`sticky top-0 z-30 w-full flex items-center justify-between border-b px-4 py-3 sm:px-7 sm:py-4 shadow-lg backdrop-blur-md transition-colors duration-200 ${
                    isDarkMode
                        ? "border-slate-800 bg-slate-900/80"
                        : "border-[#edf0eb] bg-white/80"
                }`}
            >
                <Link
                    className={`flex items-center gap-2 text-xl sm:text-2xl font-bold leading-none tracking-tight transition ${
                        isDarkMode
                            ? "text-white hover:text-cyan-400"
                            : "text-[#20231f] hover:text-cyan-600"
                    }`}
                >
                    <img src="/icon.png" alt="Logo" className="h-6 w-6 sm:h-7 sm:w-7 object-contain" />
                    <span className="leading-none">Querium</span>
                </Link>

                <button
                    type="button"
                    onClick={toggleTheme}
                    className={`flex items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition cursor-pointer ${
                        isDarkMode
                            ? "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                            : "border-[#dfe2dc] bg-[#fbfcfa] text-[#626a60] hover:border-[#c8cdc5] hover:bg-[#eef1eb] hover:text-[#20231f]"
                    }`}
                    aria-label="Toggle theme mode"
                >
                    <span
                        key={isDarkMode ? "dark" : "light"}
                        className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs sm:text-sm animate-theme-icon ${
                            isDarkMode ? "bg-slate-800" : "bg-[#eef1eb]"
                        }`}
                    >
                        {isDarkMode ? "🌙" : "☀️"}
                    </span>
                    <span>{isDarkMode ? "Dark" : "Light"}</span>
                </button>
            </nav>

            <div className="flex flex-1 items-center justify-center px-4 py-8 sm:py-12">
                <div
                    className={`w-full max-w-md rounded-2xl border p-5 sm:p-8 shadow-xl backdrop-blur-sm transition-colors duration-200 ${
                        isDarkMode
                            ? "border-slate-700 bg-slate-900/80 text-slate-100 shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_20px_45px_rgba(2,6,23,0.75)]"
                            : "border-[#dfe2dc] bg-white text-[#20231f] shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
                    }`}
                >
                    <div className="mb-6 sm:mb-8 text-center">
                        <p
                            className={`text-xs sm:text-sm font-medium uppercase tracking-[0.2em] ${
                                isDarkMode ? "text-cyan-400" : "text-cyan-600"
                            }`}
                        >
                            Welcome back
                        </p>

                        <h1
                            className={`mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold ${
                                isDarkMode ? "text-white" : "text-[#20231f]"
                            }`}
                        >
                            Login
                        </h1>
                    </div>

                    {error && (
                        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs sm:text-sm font-medium text-red-500">
                            <svg className="h-4.5 w-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className={`mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium ${
                                    isDarkMode ? "text-slate-200" : "text-slate-700"
                                }`}
                            >
                                Email
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className={`w-full rounded-xl border px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:ring-2 ${
                                    isDarkMode
                                        ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/30"
                                        : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/30"
                                }`}
                                required
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className={`mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium ${
                                    isDarkMode ? "text-slate-200" : "text-slate-700"
                                }`}
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className={`w-full rounded-xl border px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:ring-2 ${
                                    isDarkMode
                                        ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/30"
                                        : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/30"
                                }`}
                                required
                            />
                        </div>

                        <div className="flex justify-end text-right">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForgotModal(true);
                                    setForgotEmail(formData.email || "");
                                    setForgotSuccess("");
                                    setForgotError("");
                                }}
                                className={`text-xs font-medium cursor-pointer ${
                                    isDarkMode
                                        ? "text-cyan-400 hover:text-cyan-300"
                                        : "text-cyan-600 hover:text-cyan-700"
                                }`}
                            >
                                Forgot password?
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 sm:py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Signing In..." : "Sign In"}
                        </button>
                    </form>

                    <p
                        className={`mt-5 sm:mt-6 text-center text-xs sm:text-sm ${
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                        }`}
                    >
                        Don&apos;t have an account?{" "}
                        <Link
                            to="/register"
                            className={`font-medium ${
                                isDarkMode
                                    ? "text-cyan-400 hover:text-cyan-300"
                                    : "text-cyan-600 hover:text-cyan-700"
                            }`}
                        >
                            Create one
                        </Link>
                    </p>
                </div>
            </div>

            <footer
                className={`w-full border-t px-4 py-3 text-center text-xs backdrop-blur-md ${
                    isDarkMode
                        ? "border-slate-800 bg-slate-900/80 text-slate-500"
                        : "border-[#edf0eb] bg-white/80 text-slate-500"
                }`}
            >
                © {new Date().getFullYear()} Querium · Built by Abhay
            </footer>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div
                    onClick={() => setShowForgotModal(false)}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 transition-opacity"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-md rounded-2xl border p-6 sm:p-8 shadow-2xl transition-all ${
                            isDarkMode
                                ? "border-slate-700 bg-slate-900 text-slate-100"
                                : "border-slate-300 bg-white text-slate-900"
                        }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold">Forgot Password</h2>
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(false)}
                                className={`rounded-lg p-1 text-xs cursor-pointer ${
                                    isDarkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:bg-slate-100"
                                }`}
                            >
                                ✕
                            </button>
                        </div>

                        <p className={`text-xs sm:text-sm mb-5 ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                            Enter your email address below and we'll send you a link to reset your password.
                        </p>

                        {forgotError && (
                            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-medium text-red-500">
                                <span>{forgotError}</span>
                            </div>
                        )}

                        {forgotSuccess && (
                            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-500">
                                <span>{forgotSuccess}</span>
                            </div>
                        )}

                        <form onSubmit={handleForgotSubmit} className="space-y-4">
                            <div>
                                <label className={`mb-1.5 block text-xs font-medium ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={(e) => {
                                        setForgotEmail(e.target.value);
                                        setForgotError("");
                                    }}
                                    placeholder="you@example.com"
                                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 ${
                                        isDarkMode
                                            ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/30"
                                            : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/30"
                                    }`}
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForgotModal(false)}
                                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                                        isDarkMode
                                            ? "border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700"
                                            : "border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200"
                                    }`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400 cursor-pointer disabled:opacity-50"
                                >
                                    {forgotLoading ? "Sending Link..." : "Send Reset Link"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
