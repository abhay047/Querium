import nodemailer from "nodemailer";

function createTransporter() {
    // If Gmail App Password is provided (easier setup for production)
    if (process.env.GOOGLE_APP_PASSWORD || process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GOOGLE_USER || process.env.EMAIL_USER,
                pass: process.env.GOOGLE_APP_PASSWORD || process.env.EMAIL_PASS,
            },
        });
    }

    // Default to OAuth2
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            type: "OAUTH2",
            user: process.env.GOOGLE_USER,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            clientId: process.env.GOOGLE_CLIENT_ID,
        },
    });
}

const transporter = createTransporter();

transporter.verify()
    .then(() => {
        console.log("Email transporter is ready to send emails");
    })
    .catch((err) => {
        console.error("Email transporter verification failed:", err.message || err);
    });

export async function sendEmail({ to, subject, html, text }) {
    const sender = process.env.GOOGLE_USER || process.env.EMAIL_USER;
    const mailOptions = {
        from: `Querium <${sender}>`,
        to,
        subject,
        html,
        text,
    };

    try {
        const details = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to:", to, details.messageId);
        return details;
    } catch (err) {
        console.error("Failed to send email to:", to, err.message || err);
        throw err;
    }
}
