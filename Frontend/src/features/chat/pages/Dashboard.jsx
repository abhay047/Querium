import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useChat } from "../hooks/useChat";
import { useAuth } from "../../auth/hook/useAuth";
import { useTheme } from "../../../hooks/useTheme";
import {
  getChats,
  getMessages,
  sendMessage,
  deleteChat as apiDeleteChat,
} from "../service/chat.api";
import { setChats, setCurrentChatId } from "../chat.slice";
import FormattedMessage from "../components/FormattedMessage";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { initilizeSocketConnection } = useChat();
  const { handleLogout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useSelector((state) => state.auth);
  const chatsFromRedux = useSelector((state) => state.chat.chats);
  const currentChatId = useSelector((state) => state.chat.currentChatId);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("gemini");
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB limit
    if (file.size > MAX_SIZE_BYTES) {
      alert("Image size exceeds the 5 MB limit. Please select an image under 5 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  // Normalize and sort chats array (newest chats at top)
  const chatsList = Array.isArray(chatsFromRedux) ? chatsFromRedux : [];
  const sortedChats = [...chatsList].sort((a, b) => {
    const timeA = new Date(b.updatedAt || b.createdAt || 0).getTime();
    const timeB = new Date(a.updatedAt || a.createdAt || 0).getTime();
    return timeA - timeB;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  useEffect(() => {
    initilizeSocketConnection();
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      setIsLoadingChats(true);
      try {
        const response = await getChats();
        dispatch(setChats(response.chats || []));
      } catch (err) {
        console.error("Failed to load chats:", err);
      } finally {
        setIsLoadingChats(false);
      }
    };

    fetchChats();
  }, [dispatch]);

  useEffect(() => {
    if (!currentChatId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const response = await getMessages(currentChatId);
        setMessages(response.messages || []);
      } catch (err) {
        console.error("Failed to load messages:", err);
        if (err.response?.status === 404) {
          dispatch(setCurrentChatId(null));
          setMessages([]);
        }
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [currentChatId]);

  const handleSelectChat = (chatId) => {
    dispatch(setCurrentChatId(chatId));
    setShowAgentMenu(false);
    setIsSidebarOpen(false);
  };

  const handleNewChat = () => {
    dispatch(setCurrentChatId(null));
    setMessages([]);
    setMessage("");
    setSelectedImage(null);
    setShowAgentMenu(false);
    setIsSidebarOpen(false);
  };

  const requestDeleteChat = (e, chat) => {
    e.stopPropagation();
    setChatToDelete(chat);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;
    const chatId = chatToDelete._id;
    try {
      await apiDeleteChat(chatId);
      const updatedChats = chatsList.filter((c) => c._id !== chatId);
      dispatch(setChats(updatedChats));
      if (currentChatId === chatId) {
        dispatch(setCurrentChatId(null));
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    } finally {
      setChatToDelete(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setShowAgentMenu(false);
    const trimmedMessage = message.trim();
    const attachedImage = selectedImage;

    if ((!trimmedMessage && !attachedImage) || isSending) return;

    const optimisticUserMessage = {
      _id: Date.now().toString(),
      role: "user",
      content: trimmedMessage,
      image: attachedImage,
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setMessage("");
    setSelectedImage(null);
    setIsSending(true);

    try {
      const response = await sendMessage({
        message: trimmedMessage,
        image: attachedImage,
        chatId: currentChatId,
        provider: selectedAgent,
      });

      if (response?.chat) {
        const newChat = response.chat;
        dispatch(setChats([newChat, ...chatsList.filter((c) => c._id !== newChat._id)]));
        dispatch(setCurrentChatId(newChat._id));
      } else if (currentChatId) {
        const updatedChats = chatsList.map((c) =>
          c._id === currentChatId ? { ...c, updatedAt: new Date().toISOString() } : c
        );
        dispatch(setChats(updatedChats));
      }

      if (response?.aiMessage) {
        setMessages((prev) => [...prev, response.aiMessage]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        dispatch(setUser(null));
      }
    } finally {
      setIsSending(false);
    }
  };

  const activeChatObj = chatsList.find((c) => c._id === currentChatId);

  return (
    <main
      className={`h-screen w-full overflow-hidden font-sans transition-colors duration-200 ${
        isDarkMode ? "bg-[#131517] text-[#e3e5e8]" : "bg-[#f7f8f6] text-[#20231f]"
      }`}
    >
      <div
        className={`flex h-full min-h-0 overflow-hidden transition-colors duration-200 ${
          isDarkMode ? "bg-[#181a1c]" : "bg-white"
        }`}
      >
        {/* Mobile & Tablet Backdrop Overlay */}
        <div
          onClick={() => setIsSidebarOpen(false)}
          className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sidebar-backdrop lg:hidden ${
            isSidebarOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        />

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r p-5 shadow-2xl lg:shadow-none sidebar-drawer lg:static lg:z-auto lg:w-72 lg:p-6 ${
            isDarkMode
              ? "border-[#2c2f33] bg-[#1a1c1e] text-[#e3e5e8]"
              : "border-[#dfe2dc] bg-[#fbfcfa] text-[#20231f]"
          } ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xl font-semibold tracking-[-0.04em]">
              <img src="/icon.png" alt="Logo" className="h-7 w-7 object-contain" />
              Querium
            </div>
            {/* Close button for mobile & tablet sidebar */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className={`rounded-lg p-1.5 text-sm lg:hidden ${
                isDarkMode ? "text-[#9ca3af] hover:bg-[#25282c]" : "text-[#626a60] hover:bg-[#eef1eb]"
              }`}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          <button
            onClick={handleNewChat}
            className={`hover:cursor-pointer mb-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition ${
              isDarkMode
                ? "bg-[#d8f36b] text-[#131517] hover:bg-[#c9e85a]"
                : "bg-[#20231f] text-white hover:bg-[#3e443b]"
            }`}
          >
            <span className="text-lg leading-none">+</span>
            New chat
          </button>

          <p
            className={`mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
              isDarkMode ? "text-[#9ca3af]" : "text-[#899087]"
            }`}
          >
            Recent chats
          </p>

          <nav className="space-y-1 overflow-y-auto flex-1 pr-1" aria-label="Recent chats">
            {isLoadingChats ? (
              <p className={`px-3 py-2 text-xs ${isDarkMode ? "text-[#9ca3af]" : "text-[#899087]"}`}>
                Loading chats...
              </p>
            ) : sortedChats.length === 0 ? (
              <p className={`px-3 py-2 text-xs ${isDarkMode ? "text-[#9ca3af]" : "text-[#899087]"}`}>
                No recent chats
              </p>
            ) : (
              sortedChats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => handleSelectChat(chat._id)}
                  className={`group flex items-center justify-between cursor-pointer rounded-xl px-3 py-3 text-sm transition ${
                    currentChatId === chat._id
                      ? isDarkMode
                        ? "bg-[#2c3619] text-[#d8f36b] font-medium"
                        : "bg-[#eaf5c8] text-[#20231f] font-medium"
                      : isDarkMode
                      ? "text-[#9ca3af] hover:bg-[#25282c] hover:text-[#e3e5e8]"
                      : "text-[#626a60] hover:bg-[#eef1eb]"
                  }`}
                >
                  <span className="truncate flex-1">{chat.title || "Untitled Chat"}</span>
                  <button
                    type="button"
                    onClick={(e) => requestDeleteChat(e, chat)}
                    className="opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100 ml-2 rounded-lg p-1 text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                    title="Delete chat"
                    aria-label="Delete chat"
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </nav>

          {/* Account & Logout - Always at bottom */}
          <div
            className={`mt-auto border-t pt-3 ${
              isDarkMode ? "border-[#2c2f33]" : "border-[#dfe2dc]"
            }`}
          >
            <div className="flex items-center justify-between gap-2 rounded-xl p-1.5">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d8f36b] text-sm font-bold text-[#20231f]">
                  {(user?.username || user?.name || "U").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs sm:text-sm font-medium">
                    {user?.username || user?.name || "Your account"}
                  </p>
                  <p className={`mt-0.5 truncate text-[11px] sm:text-xs ${isDarkMode ? "text-[#9ca3af]" : "text-[#899087]"}`}>
                    {user?.email || "Personal workspace"}
                  </p>
                </div>
              </div>

              {/* Logout Icon Button directly on the right side */}
              <button
                type="button"
                onClick={() => setShowLogoutModal(true)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition cursor-pointer ${
                  isDarkMode
                    ? "text-red-400 hover:bg-red-500/15"
                    : "text-red-500 hover:bg-red-50"
                }`}
                title="Logout"
                aria-label="Logout"
              >
                <svg
                  className="h-4.5 w-4.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header
            className={`flex items-center justify-between border-b px-4 py-3 sm:px-8 sm:py-5 transition-colors duration-200 ${
              isDarkMode
                ? "border-[#2c2f33] bg-[#181a1c] text-[#e3e5e8]"
                : "border-[#edf0eb] bg-white text-[#20231f]"
            }`}
          >
            <div className="flex items-center gap-2.5 lg:hidden">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer ${
                  isDarkMode
                    ? "border-[#373a40] bg-[#25282c] text-[#e3e5e8]"
                    : "border-[#dfe2dc] bg-[#fbfcfa] text-[#20231f]"
                }`}
                aria-label="Open sidebar"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <img src="/icon.png" alt="Logo" className="h-6 w-6 object-contain" />
              <span className="font-semibold tracking-[-0.03em] text-sm truncate max-w-[180px] sm:max-w-xs">
                {activeChatObj ? activeChatObj.title : "Querium"}
              </span>
            </div>

            <p className={`hidden text-sm font-medium lg:block ${isDarkMode ? "text-[#9ca3af]" : "text-[#626a60]"}`}>
              {activeChatObj ? activeChatObj.title : "New Chat"}
            </p>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition cursor-pointer ${
                isDarkMode
                  ? "border-[#373a40] bg-[#25282c] text-[#e3e5e8] hover:bg-[#2d3136]"
                  : "border-[#dfe2dc] bg-[#fbfcfa] text-[#626a60] hover:border-[#c8cdc5] hover:bg-[#eef1eb] hover:text-[#20231f]"
              }`}
              aria-label="Toggle theme mode"
            >
              <span
                key={isDarkMode ? "dark" : "light"}
                className={`flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-xs sm:text-sm animate-theme-icon ${
                  isDarkMode ? "bg-[#373a40]" : "bg-[#eef1eb]"
                }`}
              >
                {isDarkMode ? "🌙" : "☀️"}
              </span>
              <span className="hidden xs:inline sm:inline">{isDarkMode ? "Dark" : "Light"}</span>
            </button>
          </header>

          {/* Messages */}
          <div className="messages-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4 sm:px-12 sm:py-8 lg:px-24">
            {isLoadingMessages ? (
              <div className={`flex h-full items-center justify-center text-sm ${isDarkMode ? "text-[#9ca3af]" : "text-[#899087]"}`}>
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <h2 className={`text-xl sm:text-2xl font-semibold tracking-tight mb-2 ${isDarkMode ? "text-[#e3e5e8]" : "text-[#20231f]"}`}>
                  What would you like to know?
                </h2>
                <p className={`text-xs sm:text-sm max-w-md ${isDarkMode ? "text-[#9ca3af]" : "text-[#899087]"}`}>
                  Ask a question or start a new conversation to begin.
                </p>
              </div>
            ) : (
              <div className="flex w-full flex-1 flex-col justify-start gap-4 sm:gap-6">
                {messages.map((item, index) => (
                  <div
                    key={item._id || index}
                    className={`flex w-full ${
                      item.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={
                        item.role === "user"
                          ? isDarkMode
                            ? "max-w-[90%] sm:max-w-[85%] break-words rounded-2xl rounded-br-md bg-[#2b3323] px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm leading-6 text-[#e3e5e8]"
                            : "max-w-[90%] sm:max-w-[85%] break-words rounded-2xl rounded-br-md bg-[#eef1eb] px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm leading-6 text-[#20231f]"
                          : isDarkMode
                          ? "max-w-[96%] sm:max-w-[92%] break-words rounded-2xl border border-[#2c2f33] bg-[#1a1c1e] px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm leading-6 sm:leading-7 text-[#e3e5e8]"
                          : "max-w-[96%] sm:max-w-[92%] break-words rounded-2xl border border-[#dfe2dc] bg-white px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm leading-6 sm:leading-7 text-[#20231f]"
                      }
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt="Uploaded attachment"
                          className="max-h-64 w-auto rounded-xl mb-2.5 object-contain border border-black/10 dark:border-white/10"
                        />
                      )}
                      {item.content && (
                        <FormattedMessage content={item.content} isDarkMode={isDarkMode} />
                      )}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex w-full justify-start">
                    <div
                      className={`max-w-[96%] sm:max-w-[92%] break-words rounded-2xl border px-4 py-3 sm:px-5 sm:py-4 text-xs sm:text-sm animate-pulse ${
                        isDarkMode
                          ? "border-[#2c2f33] bg-[#1a1c1e] text-[#9ca3af]"
                          : "border-[#dfe2dc] bg-white text-[#899087]"
                      }`}
                    >
                      Querium is thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input Container */}
          <div className="shrink-0 px-3 pb-3 sm:px-8 sm:pb-8 lg:px-24">
            {/* Attached Image Preview Chip */}
            {selectedImage && (
              <div className="mx-auto mb-2.5 flex max-w-3xl items-center px-1 sm:px-0">
                <div className="relative flex items-center gap-2.5 rounded-2xl border p-1.5 pr-3 shadow-md bg-white dark:bg-[#1a1c1e] border-[#dfe2dc] dark:border-[#373a40]">
                  <img
                    src={selectedImage}
                    alt="Attachment preview"
                    className="h-11 w-11 rounded-xl object-cover"
                  />
                  <span className="text-xs font-medium opacity-90">Image attached</span>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="ml-1 rounded-full p-1 text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className={`mx-auto flex max-w-3xl items-center gap-1.5 sm:gap-3 rounded-2xl border p-1.5 sm:p-2 shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-colors duration-200 ${
                isDarkMode
                  ? "border-[#373a40] bg-[#1a1c1e]"
                  : "border-[#20231f] bg-white"
              }`}
            >
              <label htmlFor="chat-message" className="sr-only">
                Write a message
              </label>

              {/* Hidden File Input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
                id="image-upload-input"
              />

              {/* Plus (+) Upload Button on Left Side */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition cursor-pointer text-lg font-medium leading-none ${
                  selectedImage
                    ? isDarkMode
                      ? "bg-[#d8f36b] text-[#131517]"
                      : "bg-[#20231f] text-white"
                    : isDarkMode
                    ? "text-[#9ca3af] hover:bg-[#25282c] hover:text-[#e3e5e8]"
                    : "text-[#626a60] hover:bg-[#eef1eb] hover:text-[#20231f]"
                }`}
                title="Upload image"
                aria-label="Upload image"
              >
                +
              </button>

              <input
                id="chat-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={selectedImage ? "Ask something about this image..." : "Ask anything..."}
                disabled={isSending}
                className={`min-w-0 flex-1 bg-transparent px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm outline-none disabled:opacity-50 ${
                  isDarkMode
                    ? "text-[#e3e5e8] placeholder:text-[#6b7280]"
                    : "text-[#20231f] placeholder:text-[#9da49b]"
                }`}
              />

              <div className="relative shrink-0">
                {showAgentMenu && (
                  <div
                    className={`absolute bottom-full mb-2 right-0 w-32 rounded-xl border p-1 shadow-lg backdrop-blur-md transition z-30 ${
                      isDarkMode
                        ? "border-[#373a40] bg-[#1a1c1e] text-[#e3e5e8]"
                        : "border-[#dfe2dc] bg-white text-[#20231f]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAgent("gemini");
                        setShowAgentMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                        selectedAgent === "gemini"
                          ? isDarkMode
                            ? "bg-[#25282c] text-[#d8f36b] font-semibold"
                            : "bg-[#eef1eb] text-[#20231f] font-semibold"
                          : isDarkMode
                          ? "hover:bg-[#25282c]"
                          : "hover:bg-[#f7f8f6]"
                      }`}
                    >
                      <span>Gemini</span>
                      {selectedAgent === "gemini" && <span>✓</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAgent("mistral");
                        setShowAgentMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition cursor-pointer ${
                        selectedAgent === "mistral"
                          ? isDarkMode
                            ? "bg-[#25282c] text-[#d8f36b] font-semibold"
                            : "bg-[#eef1eb] text-[#20231f] font-semibold"
                          : isDarkMode
                          ? "hover:bg-[#25282c]"
                          : "hover:bg-[#f7f8f6]"
                      }`}
                    >
                      <span>Mistral</span>
                      {selectedAgent === "mistral" && <span>✓</span>}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowAgentMenu((prev) => !prev)}
                  disabled={isSending}
                  className={`flex items-center gap-1 sm:gap-1.5 rounded-xl border px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-semibold outline-none transition cursor-pointer disabled:opacity-50 ${
                    isDarkMode
                      ? "border-[#373a40] bg-[#25282c] text-[#e3e5e8] hover:bg-[#2d3136]"
                      : "border-[#dfe2dc] bg-[#fbfcfa] text-[#20231f] hover:bg-[#eef1eb]"
                  }`}
                  aria-label="Select AI Model"
                >
                  <span className="capitalize">{selectedAgent}</span>
                  <span className="text-[9px] opacity-70">▲</span>
                </button>
              </div>

              <button
                type="submit"
                className="shrink-0 rounded-xl bg-[#d8f36b] px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-[#20231f] transition hover:bg-[#c9e85a] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                disabled={!message.trim() || isSending}
              >
                Send
              </button>
            </form>

            <p className={`mt-2 sm:mt-3 text-center text-[10px] sm:text-[11px] ${isDarkMode ? "text-[#6b7280]" : "text-[#9da49b]"}`}>
              Querium can make mistakes. Check important information.
            </p>
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {chatToDelete && (
        <div
          onClick={() => setChatToDelete(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 transition-opacity"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border p-5 sm:p-6 shadow-2xl transition-all ${
              isDarkMode
                ? "border-[#2c2f33] bg-[#1a1c1e] text-[#e3e5e8]"
                : "border-[#dfe2dc] bg-white text-[#20231f]"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold">Delete chat?</h3>
                <p className={`text-xs mt-0.5 ${isDarkMode ? "text-[#9ca3af]" : "text-[#899087]"}`}>
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className={`text-xs rounded-xl p-3 mb-5 border break-words ${
              isDarkMode
                ? "border-[#2c2f33] bg-[#25282c] text-[#e3e5e8]"
                : "border-[#dfe2dc] bg-[#f7f8f6] text-[#20231f]"
            }`}>
              "<span className="font-semibold">{chatToDelete.title || "Untitled Chat"}</span>" will be permanently deleted.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setChatToDelete(null)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                  isDarkMode
                    ? "border border-[#2c2f33] bg-[#25282c] text-[#e3e5e8] hover:bg-[#2d3136]"
                    : "border border-[#dfe2dc] bg-[#fbfcfa] text-[#20231f] hover:bg-[#eef1eb]"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteChat}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          onClick={() => setShowLogoutModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 transition-opacity"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border p-5 sm:p-6 shadow-2xl transition-all ${
              isDarkMode
                ? "border-[#2c2f33] bg-[#1a1c1e] text-[#e3e5e8]"
                : "border-[#dfe2dc] bg-white text-[#20231f]"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold">Log out?</h3>
                <p className={`text-xs mt-0.5 ${isDarkMode ? "text-[#9ca3af]" : "text-[#899087]"}`}>
                  Are you sure you want to log out of your account?
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
                  isDarkMode
                    ? "border border-[#2c2f33] bg-[#25282c] text-[#e3e5e8] hover:bg-[#2d3136]"
                    : "border border-[#dfe2dc] bg-[#fbfcfa] text-[#20231f] hover:bg-[#eef1eb]"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowLogoutModal(false);
                  await handleLogout();
                }}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 cursor-pointer shadow-xs"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Dashboard;
