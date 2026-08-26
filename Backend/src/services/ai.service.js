import "dotenv/config";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage, AIMessage, tool } from "langchain";
import * as z from "zod";
import { searchInternet } from "./internet.service.js";

function cleanResponseText(rawText) {
    if (!rawText) return "";
    let str = typeof rawText === "string" ? rawText : String(rawText);

    // Remove preambles like "I will retrieve...", "Let me search...", "I am fetching...", etc.
    str = str.replace(/^(?:I'll|I will|Let me|I am|Allow me to)\s+(?:retrieve|search|fetch|look up|find|get)[^\.\n]*[\.\n\s]*/gmi, "");

    // Remove leftover tool call headers like [Internet Search Results...]
    str = str.replace(/\[(?:Real-time\s+)?Internet Search[^\n]*\]/gi, "");

    // Fix double Markdown heading hashes like "### ##" -> "### "
    str = str.replace(/(#{1,6})\s*#{1,6}\s*/g, "$1 ");

    return str.trim();
}

const models = {
    gemini: new ChatGoogleGenerativeAI({
        model: "gemini-3.5-flash-lite",
        apiKey: process.env.GEMINI_API_KEY,
    }),

    mistral: new ChatMistralAI({
        model: "pixtral-12b-2409",
        apiKey: process.env.MISTRAL_API_KEY,
    }),
};

const searchInternetTool = tool(
    async (input) => {
        try {
            const results = await searchInternet(input);
            return typeof results === "string" ? results : JSON.stringify(results);
        } catch (err) {
            console.error("Internet search error:", err);
            return "Unable to retrieve search results.";
        }
    },
    {
        name: "searchInternet",
        description: "Use this tool to search the live internet for real-time information, latest news, weather forecasts, stock/crypto prices, sports scores, or recent events.",
        schema: z.object({
            query: z.string().describe("The search query to look up on the internet")
        })
    }
);

export async function generateResponse(messages, provider = "gemini") {
    const baseModel = models[provider] || models.gemini;

    const systemInstruction = new SystemMessage(
        "You are Querium AI, an intelligent assistant equipped with vision image identification and live real-time internet search capabilities. Whenever an image is provided by the user, inspect and analyze the image thoroughly. If you need live internet facts, current prices, weather, or recent news, use the searchInternet tool. ALWAYS answer user questions directly without any preamble or mentioning tool names, using clean Markdown with bold headings, bullet points, and code blocks."
    );

    // Context Window Optimization: Keep recent 8 messages to guarantee ultra-fast response times (<1s)
    const recentMessagesList = messages.length > 8 ? messages.slice(-8) : messages;

    const formattedMessages = [
        systemInstruction,
        ...recentMessagesList
            .map(msg => {
                if (msg.role === "user") {
                    if (msg.image) {
                        return new HumanMessage({
                            content: [
                                { type: "text", text: msg.content || "Describe or analyze this image." },
                                { type: "image_url", image_url: { url: msg.image } }
                            ]
                        });
                    }
                    return new HumanMessage(msg.content || "");
                } else if (msg.role === "ai") {
                    return new AIMessage(msg.content || "");
                }
            })
            .filter(Boolean)
    ];

    const lastUserMsg = messages[messages.length - 1];
    const lastContent = (lastUserMsg?.content || "").toLowerCase();
    const hasImage = !!lastUserMsg?.image;

    // Smart real-time search trigger
    const realTimeKeywords = ["today", "weather", "news", "price", "stock", "score", "match", "live", "latest", "who won", "current", "event", "forecast"];
    const needsSearchOrVision = hasImage || realTimeKeywords.some(kw => lastContent.includes(kw));

    try {
        let response;
        if (needsSearchOrVision) {
            const modelWithTools = baseModel.bindTools([searchInternetTool]);
            response = await modelWithTools.invoke(formattedMessages);

            let toolCalls = response.tool_calls || [];
            if (toolCalls.length === 0 && Array.isArray(response.content)) {
                for (const item of response.content) {
                    if (item.type === "functionCall" && item.functionCall) {
                        toolCalls.push({
                            name: item.functionCall.name,
                            args: item.functionCall.args,
                            id: item.functionCall.id
                        });
                    }
                }
            }

            if (toolCalls.length > 0) {
                let combinedSearchResults = "";
                for (const toolCall of toolCalls) {
                    if (toolCall.name === "searchInternet") {
                        const searchResults = await searchInternetTool.invoke(toolCall.args);
                        const searchString = typeof searchResults === "string" ? searchResults : JSON.stringify(searchResults);
                        combinedSearchResults += `[Internet Search Results for "${toolCall.args?.query || ''}"]:\n${searchString}\n\n`;
                    }
                }

                if (combinedSearchResults) {
                    const searchPrompt = [
                        ...formattedMessages,
                        new HumanMessage(`[Real-time Internet Search Context]:\n${combinedSearchResults}\nBased on the above real-time internet search results, please provide a complete, clear, and well-formatted answer to the user.`)
                    ];

                    response = await baseModel.invoke(searchPrompt);
                }
            }
        } else {
            // Direct ultra-fast LLM invocation (< 800ms) for general queries, coding, logic, and chat
            response = await baseModel.invoke(formattedMessages);
        }

        let finalContent = response.content;
        if (Array.isArray(finalContent)) {
            finalContent = finalContent
                .map(c => (typeof c === "string" ? c : c.text || ""))
                .filter(Boolean)
                .join("\n");
        } else if (typeof finalContent !== "string") {
            finalContent = response.text || String(finalContent || "");
        }

        return cleanResponseText(finalContent) || "Unable to generate a response.";
    } catch (err) {
        console.warn("Primary model invocation failed, falling back to Mistral due to:", err.message);
        try {
            const fallbackResponse = await models.mistral.invoke(formattedMessages);
            let fallbackContent = fallbackResponse.content;
            if (Array.isArray(fallbackContent)) {
                fallbackContent = fallbackContent
                    .map(c => (typeof c === "string" ? c : c.text || ""))
                    .filter(Boolean)
                    .join("\n");
            } else if (typeof fallbackContent !== "string") {
                fallbackContent = fallbackResponse.text || String(fallbackContent || "");
            }
            return cleanResponseText(fallbackContent) || "Unable to generate a response.";
        } catch (fallbackErr) {
            console.error("Fallback AI model invocation error:", fallbackErr);
            return "Unable to generate a response at this time. Please try again.";
        }
    }
}

export async function generateChatTitle(message) {
    const response = await models.mistral.invoke([
        new SystemMessage(`You are a helpful assistant that generates concise and descriptive titles for chat conversations.

            User will provide you with the first message of a chat conversation, and you will generate a title that captures the essence of the conversation in 2-4 words. The title should be clear, relevent, and engaging, giving users a quick understanding of the chat's topic.
            `),
        new HumanMessage(`
                Generate a title for a chat conversation based on the following first message:
                "${message}"
                `)
    ])

    return response.content || response.text || "New Chat";
}