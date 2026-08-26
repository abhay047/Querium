import { generateResponse, generateChatTitle } from "../services/ai.service.js";
import chatModel from "../models/chat.model.js"
import messageModel from "../models/message.model.js"
import mongoose from "mongoose";

export async function sendMessage(req, res) {
    try {
        const { message, image, chat: chatId, provider } = req.body;

        if (image && typeof image === "string") {
            const approximateSizeBytes = (image.length * (3 / 4));
            if (approximateSizeBytes > 5.5 * 1024 * 1024) {
                return res.status(400).json({
                    message: "Image size exceeds the 5 MB limit. Please upload a smaller image."
                });
            }
        }

        let title = null, chat = null;

        if (chatId && mongoose.Types.ObjectId.isValid(chatId)) {
            chat = await chatModel.findOne({ _id: chatId, user: req.user.id });
        }

        if (!chat) {
            title = await generateChatTitle(message || "Image Analysis");
            chat = await chatModel.create({
                user: req.user.id,
                title
            });
        }

        const targetChatId = chat._id;

        const userMessage = await messageModel.create({
            chat: targetChatId,
            content: message || "",
            image: image || null,
            role: "user"
        });

        const messages = await messageModel.find({ chat: targetChatId });

        const result = await generateResponse(messages, provider);

        const aiMessage = await messageModel.create({
            chat: targetChatId,
            content: result,
            role: "ai"
        });

        await chatModel.findByIdAndUpdate(targetChatId, { updatedAt: new Date() });

        return res.status(201).json({
            title,
            chat,
            userMessage,
            aiMessage
        });
    } catch (err) {
        console.error("Error in sendMessage controller:", err);
        return res.status(500).json({
            message: "Failed to process message",
            error: err.message
        });
    }
}

export async function getChats(req,res) {
    const user = req.user

    const chats = await chatModel.find({user: user.id}).sort({ updatedAt: -1, createdAt: -1 })

    res.status(200).json({
        message: "Chats retrieved successfully",
        chats
    })
}

export async function getMessages(req,res) {
    const {chatId} = req.params;

    const chat = await chatModel.findOne({
        _id: chatId,
        user: req.user.id
    })

    if(!chat){
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    const messages = await messageModel.find({
        chat: chatId
    })

    res.status(200).json({
        message: "Message retrieved successfully",
        messages
    })
}

export async function deleteChat(req,res) {
    const {chatId} = req.params;

    const chat = await chatModel.findOneAndDelete({
        _id: chatId,
        user: req.user.id
    })

    if(!chat){
        return res.status(404).json({
            message: "Chat not found"
        })
    }

    await messageModel.deleteMany({
        chat: chatId
    })

    res.status(200).json({
        message:"Chat deleted successfully"
    })
}