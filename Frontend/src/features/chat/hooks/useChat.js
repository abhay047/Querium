import { initilizeSocketConnection } from "../service/chat.socket.js";
import {
    sendMessage,
    getChats,
    getMessages,
    deleteChat,
} from "../service/chat.api.js";
import {
    setChats,
    setCurrentChatId,
    setError,
    setLoading,
} from "../chat.slice.js";
import { useDispatch } from "react-redux";

export const useChat = () => {
    const dispatch = useDispatch();

    async function handleSendMessage({ message, chatId, provider }) {
        dispatch(setLoading(true));
        const data = await sendMessage({ message, chatId, provider });
        const { chat, aiMessage } = data;
        dispatch(setChats((prev) => {
                return {
                    ...prev,
                    [chat._id]: {
                        ...chat,
                        messages: [{ content: message, role: "user" }, { aiMessage }],
                    },
                };
            }));
        dispatch(setCurrentChatId(chat._id))
    }

    return {
        initilizeSocketConnection,
        handleSendMessage
    };
};
