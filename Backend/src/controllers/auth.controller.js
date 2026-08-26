import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";
import redis from "../config/cache.js";

export async function register(req, res) {
    const { username, email, password } = req.body;

    const isUserAlreadyExists = await userModel.findOne({
        $or: [{ email }, { username }],
    });

    if (isUserAlreadyExists) {
        const isEmailMatched = isUserAlreadyExists.email === email;
        const isUsernameMatched = isUserAlreadyExists.username === username;

        let message = "User with this email or username already exists";
        if (isEmailMatched && isUsernameMatched) {
            message = "User with this email and username already exists";
        } else if (isEmailMatched) {
            message = "User with this email already exists";
        } else if (isUsernameMatched) {
            message = "User with this username already exists";
        }

        return res.status(400).json({
            message,
            success: false,
            err: "User already exists",
        });
    }

    const user = await userModel.create({ username, email, password });

    const emailVerificationToken = jwt.sign(
        {
            email: user.email,
        },
        process.env.JWT_SECRET,
    );

    try {
        await sendEmail({
            to: email,
            subject: "Welcome to Querium!",
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Querium</title>
</head>

<body style="
    margin: 0;
    padding: 0;
    background-color: #f4f4f4;
    font-family: Arial, Helvetica, sans-serif;
">

    <div style="
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 14px;
        overflow: hidden;
        border: 1px solid #e5e5e5;
    ">

        <!-- Header -->
        <div style="
            padding: 35px 30px;
            text-align: center;
            background-color: #ffffff;
        ">
            <h1 style="
                margin: 0;
                font-size: 30px;
                color: #111111;
                font-weight: 700;
            ">
                Welcome to Querium
            </h1>

            <p style="
                margin: 10px 0 0;
                color: #777777;
                font-size: 14px;
            ">
                Your journey to better answers starts here.
            </p>
        </div>

        <!-- Content -->
        <div style="
            padding: 35px 40px;
            color: #333333;
        ">

            <p style="
                margin: 0 0 20px;
                font-size: 17px;
            ">
                Hi <strong>${username}</strong>,
            </p>

            <p style="
                font-size: 16px;
                line-height: 1.7;
                margin: 0 0 18px;
            ">
                We're really glad to have you here.
            </p>

            <p style="
                font-size: 16px;
                line-height: 1.7;
                margin: 0 0 18px;
            ">
                Your Querium account has been created successfully.
                You can now ask questions, explore ideas, discover
                information, and find answers faster.
            </p>

            <p style="
                font-size: 16px;
                line-height: 1.7;
                margin: 0 0 25px;
            ">
                Before you get started, please verify your email address.
            </p>

            <!-- Verify Button -->
            <div style="
                text-align: center;
                margin: 30px 0;
            ">

                <a href="${process.env.BACKEND_URL || 'https://querium.onrender.com'}/api/auth/verify-email?token=${emailVerificationToken}"
                   style="
                        display: inline-block;
                        padding: 14px 30px;
                        background-color: #111111;
                        color: #ffffff;
                        text-decoration: none;
                        border-radius: 8px;
                        font-size: 15px;
                        font-weight: 600;
                   ">
                    Verify Email
                </a>

            </div>

            <p style="
                font-size: 13px;
                line-height: 1.6;
                color: #888888;
                margin-top: 25px;
            ">
                This verification link will expire soon. If you didn't
                create this account, you can safely ignore this email.
            </p>

            <p style="
                font-size: 16px;
                line-height: 1.7;
                margin-top: 30px;
                margin-bottom: 8px;
            ">
                Thank you for joining us. We're excited to have you with us!
            </p>

            <p style="
                font-size: 15px;
                color: #666666;
                margin: 0;
                line-height: 1.7;
            ">
                Best regards,<br>
                <strong>The Querium Team</strong>
            </p>

        </div>

        <!-- Footer -->
        <div style="
            padding: 20px 30px;
            background-color: #fafafa;
            text-align: center;
            border-top: 1px solid #eeeeee;
        ">

            <p style="
                margin: 0;
                font-size: 12px;
                color: #999999;
            ">
                © 2026 Querium. All rights reserved.
            </p>

        </div>

    </div>

</body>
        });
    } catch (err) {
        console.error("Welcome email failed to send:", err.message || err);
    }

    return res.status(201).json({
        message: "User registered successfully",
        success: true,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
        },
    });
}

export async function login(req, res) {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });

    if(!user){
        return res.status(400).json({
            message: "Account not found, please register",
            success: false,
            err: "User not found"
        })
    }

    const isPasswordMatch = await user.comparePassword(password)

    if(!isPasswordMatch){
        return res.status(400).json({
            message: "Incorrect password. Please try again.",
            success: false,
            err: "Incorrect password"
        })
    }

    if(!user.verified){
        return res.status(400).json({
            message:"Please verify your email before logging in",
            success: false,
            err:"Email not verified"
        })
    }

    const token = jwt.sign({
        id: user._id,
        username: user.username,
    }, process.env.JWT_SECRET, {expiresIn: "7d"})

    const cookieOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000
    };

    res.cookie("token", token, cookieOptions)

    res.status(200).json({
        message: "Login successfully",
        success: true,
        token,
        user:{
            id: user._id,
            username: user.username,
            email: user.email
        }
    })
}

export async function verifyEmail(req, res) {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid token",
                success: false,
                err: "User not found",
            });
        }

        user.verified = true;

        await user.save();

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Email Verified | Querium</title>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f5f5f5;
            font-family: Arial, Helvetica, sans-serif;
            padding: 20px;
        }

        .container {
            width: 100%;
            max-width: 480px;
            background: #ffffff;
            border: 1px solid #e5e5e5;
            border-radius: 18px;
            padding: 45px 35px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }

        .success-icon {
            width: 72px;
            height: 72px;
            margin: 0 auto 25px;
            border-radius: 50%;
            background: #e8f8ee;
            color: #22a05a;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: bold;
        }

        h1 {
            color: #111;
            font-size: 28px;
            margin-bottom: 15px;
        }

        .message {
            color: #666;
            font-size: 16px;
            line-height: 1.7;
            margin-bottom: 25px;
        }

        .button {
            display: inline-block;
            padding: 14px 28px;
            background: #111;
            color: #fff;
            text-decoration: none;
            border-radius: 9px;
            font-size: 15px;
            font-weight: 600;
            transition: opacity 0.2s ease;
        }

        .button:hover {
            opacity: 0.85;
        }

        .footer {
            margin-top: 30px;
            color: #999;
            font-size: 13px;
            line-height: 1.6;
        }

        .team {
            margin-top: 8px;
            color: #666;
        }
    </style>
</head>

<body>

    <div class="container">

        <div class="success-icon">
            ✓
        </div>

        <h1>Email Verified!</h1>

        <p class="message">
            Your email has been successfully verified.
            Your Querium account is now ready to use.
        </p>

        <a
            href="${process.env.CLIENT_URL || 'https://querium-nu.vercel.app'}/login"
            class="button"
        >
            Continue to Querium
        </a>

        <div class="footer">
            <p>
                Thank you for joining us!
            </p>

            <p class="team">
                — The Querium Team
            </p>
        </div>

    </div>

</body>
</html>
`;

        return res.send(html);
    } catch (err) {
        return res.status(400).json({
            message: "Invalid or expired token",
            success: false,
            err: err.message,
        });
    }
}

export async function getMe(req,res) {
    const userId = req.user.id;

    const user = await userModel.findById(userId).select("-password");

    if (!user){
        return res.status(404).json({
            message:"User not found",
            success: false,
            err: "User not found"
        })
    }

    res.status(200).json({
        message:"User details fetched successfully",
        success: true,
        user
    })
}

export async function logout(req, res) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(400).json({
            message: "No token provided",
            success: false,
            err: "No token provided"
        });
    }

    try {
        const decoded = jwt.decode(token);
        let ttl = 60 * 60 * 24 * 7; // default 7 days in seconds

        if (decoded && decoded.exp) {
            const currentTime = Math.floor(Date.now() / 1000);
            ttl = decoded.exp - currentTime;
        }

        if (ttl > 0) {
            await redis.set(`token:${token}`, "logout", "EX", ttl);
        }

        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "none"
        });

        return res.status(200).json({
            message: "Logged out successfully",
            success: true
        });
    } catch (err) {
        return res.status(500).json({
            message: "Logout failed",
            success: false,
            err: err.message
        });
    }
}

export async function forgotPassword(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: "Please provide an email address",
            success: false,
            err: "Email required"
        });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
        return res.status(400).json({
            message: "Account with this email does not exist. Please register first.",
            success: false,
            err: "User not found"
        });
    }

    if (!user.verified) {
        return res.status(400).json({
            message: "Your email is not verified yet. Please verify your email before resetting your password.",
            success: false,
            err: "Email not verified"
        });
    }

    const resetToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    try {
        await sendEmail({
            to: email,
            subject: "Reset Your Querium Password",
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Querium</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e5e5e5;">
        <div style="padding: 35px 30px; text-align: center; background-color: #ffffff;">
            <h1 style="margin: 0; font-size: 28px; color: #111111; font-weight: 700;">Reset Your Password</h1>
            <p style="margin: 10px 0 0; color: #777777; font-size: 14px;">We received a request to reset your Querium password.</p>
        </div>
        <div style="padding: 30px 40px; color: #333333;">
            <p style="margin: 0 0 20px; font-size: 16px;">Hi <strong>${user.username}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 25px;">Click the button below to reset your password. This link is valid for 15 minutes.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL || 'https://querium-nu.vercel.app'}/reset-password?token=${resetToken}" style="display: inline-block; padding: 14px 30px; background-color: #111111; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600;">Reset Password</a>
            </div>
            <p style="font-size: 13px; line-height: 1.6; color: #888888; margin-top: 25px;">If you didn't request a password reset, you can safely ignore this email.</p>
            <p style="font-size: 15px; color: #666666; margin-top: 30px; margin-bottom: 8px;">Best regards,<br><strong>The Querium Team</strong></p>
        </div>
        <div style="padding: 20px 30px; background-color: #fafafa; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="margin: 0; font-size: 12px; color: #999999;">© 2026 Querium. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`,
        });

        return res.status(200).json({
            message: "Password reset link sent to your email",
            success: true
        });
    } catch (err) {
        console.error("Forgot password email failed", err);
        return res.status(500).json({
            message: "Failed to send password reset email",
            success: false,
            err: err.message
        });
    }
}

export async function resetPassword(req, res) {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({
            message: "Reset token and new password are required",
            success: false,
            err: "Missing parameters"
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            message: "Password should be at least 6 characters long",
            success: false,
            err: "Password too short"
        });
    }

    try {
        const isUsed = await redis.get(`used_reset_token:${token}`);
        if (isUsed) {
            return res.status(400).json({
                message: "This password reset link has already been used",
                success: false,
                err: "Token used"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false,
                err: "User not found"
            });
        }

        user.password = newPassword;
        await user.save();

        await redis.set(`used_reset_token:${token}`, "true", "EX", 15 * 60);

        return res.status(200).json({
            message: "Password reset successfully. You can now login.",
            success: true
        });
    } catch (err) {
        return res.status(400).json({
            message: "Invalid or expired password reset token",
            success: false,
            err: err.message
        });
    }
}