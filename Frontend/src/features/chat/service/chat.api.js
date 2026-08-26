import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://querium.onrender.com",
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const sendMessage = async ({ message, image, chatId, provider }) => {
    const response = await api.post("/api/chats/message", { message, image, chat: chatId, provider });
    return response.data;
};

export const getChats = async () => {
    const response = await api.get("/api/chats");
    return response.data;
};

export const getMessages = async (chatId) => {
    const response = await api.get(`/api/chats/${chatId}/messages`);
    return response.data;
};

export const deleteChat = async (chatId) => {
    const response = await api.delete(`/api/chats/delete/${chatId}`);
    return response.data;
};
