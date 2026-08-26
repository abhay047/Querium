import jwt from "jsonwebtoken"
import redis from "../config/cache.js";

export async function authUser(req,res,next){
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith("Bearer ")) {
            const extracted = authHeader.split(" ")[1];
            if (extracted && extracted !== "null" && extracted !== "undefined") {
                token = extracted;
            }
        }
    }

    if(!token || token === "null" || token === "undefined"){
        return res.status(401).json({
            message: "Unauthorized",
            success: false,
            err: "No token provided"
        })
    }

    try{
        const isBlacklisted = await redis.get(`token:${token}`);
        if(isBlacklisted){
            return res.status(401).json({
                message: "Unauthorized",
                success: false,
                err: "Token is blacklisted"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next()
    }catch(err){
        return res.status(401).json({
            message: "Unauthorized",
            success: false,
            err:"Invalid token"
        })
    }
}