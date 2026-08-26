import axios from "axios"
const api = axios.create({
    baseURL:"https://querium.onrender.com",
    withCredentials: true
})

export async function register({email, username, password}) {
    const response = await api.post("/api/auth/register", {email, username, password})
    return response.data
}

export async function login({email ,password}) {
    const response = await api.post("/api/auth/login", {email, password})
    return response.data
}

export async function getMe() {
    const response = await api.get("/api/auth/get-me")
    return response.data
}

export async function logout() {
    const response = await api.get("/api/auth/logout")
    return response.data
}

export async function forgotPassword({ email }) {
    const response = await api.post("/api/auth/forgot-password", { email })
    return response.data
}

export async function resetPassword({ token, newPassword }) {
    const response = await api.post("/api/auth/reset-password", { token, newPassword })
    return response.data
}