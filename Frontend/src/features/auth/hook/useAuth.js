import { useDispatch } from "react-redux";
import { register, login, getMe, logout, forgotPassword, resetPassword } from "../services/auth.api.js";
import { setUser, setLoading, setError } from "../auth.slice.js";

export function useAuth() {
    const dispatch = useDispatch()

    async function handleRegister({ email, username, password }) {
        try {
            dispatch(setLoading(true))
            dispatch(setError(null))
            const data = await register({ email, username, password })
            return data
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Registration failed"
            dispatch(setError(errorMsg))
            throw error
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleLogin({ email, password }) {
        try {
            dispatch(setLoading(true))
            dispatch(setError(null))
            const data = await login({ email, password })
            dispatch(setUser(data.user))
            return data
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || "Login failed"
            dispatch(setError(errorMsg))
            throw error
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleGetMe() {
        try {
            dispatch(setLoading(true))
            const data = await getMe()
            dispatch(setUser(data.user))
        } catch (error) {
            dispatch(setUser(null))
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleLogout() {
        try {
            dispatch(setLoading(true))
            await logout()
            dispatch(setUser(null))
        } catch (error) {
            dispatch(setError(error.response?.data?.message || "Logout failed"))
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleForgotPassword({ email }) {
        try {
            dispatch(setLoading(true))
            dispatch(setError(null))
            const data = await forgotPassword({ email })
            return data
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to send reset link"
            dispatch(setError(errorMsg))
            throw error
        } finally {
            dispatch(setLoading(false))
        }
    }

    async function handleResetPassword({ token, newPassword }) {
        try {
            dispatch(setLoading(true))
            dispatch(setError(null))
            const data = await resetPassword({ token, newPassword })
            return data
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to reset password"
            dispatch(setError(errorMsg))
            throw error
        } finally {
            dispatch(setLoading(false))
        }
    }

    return{
        handleRegister,
        handleLogin,
        handleGetMe,
        handleLogout,
        handleForgotPassword,
        handleResetPassword
    }

}