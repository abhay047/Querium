import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "../hook/useAuth";
import { setError } from "../auth.slice";
import { useTheme } from "../../../hooks/useTheme";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [successMsg, setSuccessMsg] = useState("");

  const dispatch = useDispatch();
  const { error, loading } = useSelector((state) => state.auth);
  const { isDarkMode, toggleTheme } = useTheme();
  const { handleRegister } = useAuth();

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
    setSuccessMsg("");
    try {
      await handleRegister(formData);
      setSuccessMsg("Registration successful! Please check your email to verify your account.");
    } catch (err) {
      // Error is set in Redux by handleRegister
    }
  };

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
              ? "text-white hover:text-violet-400"
              : "text-[#20231f] hover:text-violet-600"
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
              ? "border-slate-700 bg-slate-900/80 text-slate-100 shadow-[0_0_0_1px_rgba(168,85,247,0.25),0_20px_45px_rgba(2,6,23,0.75)]"
              : "border-[#dfe2dc] bg-white text-[#20231f] shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
          }`}
        >
          <div className="mb-6 sm:mb-8 text-center">
            <p
              className={`text-xs sm:text-sm font-medium uppercase tracking-[0.2em] ${
                isDarkMode ? "text-violet-400" : "text-violet-600"
              }`}
            >
              Create account
            </p>

            <h1
              className={`mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold ${
                isDarkMode ? "text-white" : "text-[#20231f]"
              }`}
            >
              Register
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

          {successMsg && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs sm:text-sm font-medium text-emerald-500">
              <svg className="h-4.5 w-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label
                htmlFor="username"
                className={`mb-1.5 sm:mb-2 block text-xs sm:text-sm font-medium ${
                  isDarkMode ? "text-slate-200" : "text-slate-700"
                }`}
              >
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="yourname"
                className={`w-full rounded-xl border px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm outline-none focus:ring-2 ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/30"
                    : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-violet-500/30"
                }`}
                required
              />
            </div>

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
                    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/30"
                    : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-violet-500/30"
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
                    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-violet-500 focus:ring-violet-500/30"
                    : "border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:ring-violet-500/30"
                }`}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-500 px-4 py-2.5 sm:py-3 text-sm font-semibold text-white transition hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/60 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p
            className={`mt-5 sm:mt-6 text-center text-xs sm:text-sm ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              className={`font-medium ${
                isDarkMode
                  ? "text-violet-400 hover:text-violet-300"
                  : "text-violet-600 hover:text-violet-700"
              }`}
            >
              Login
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
    </div>
  );
};

export default Register;
