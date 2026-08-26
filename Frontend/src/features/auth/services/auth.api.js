import axios from "axios"
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://querium.onrender.com",
    withCredentials: true
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token")
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export async function register({email, username, password}) {
    const response = await api.post("/api/auth/register", {email, username, password})
    return response.data
}

export async function login({email ,password}) {
    const response = await api.post("/api/auth/login", {email, password})
    if (response.data?.token) {
        localStorage.setItem("token", response.data.token)
    }
    return response.data
}

export async function getMe() {
    const response = await api.get("/api/auth/get-me")
    return response.data
}

export async function logout() {
    try {
        const response = await api.get("/api/auth/logout")
        return response.data
    } finally {
        localStorage.removeItem("token")
    }
}

export async function forgotPassword({ email }) {
    const response = await api.post("/api/auth/forgot-password", { email })
    return response.data
}

export async function resetPassword({ token, newPassword }) {
    const response = await api.post("/api/auth/reset-password", { token, newPassword })
    return response.data
}