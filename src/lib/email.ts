import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendPasswordResetEmail(to: string, resetLink: string) {
    await transporter.sendMail({
        from: `"MultivRSS" <${process.env.SMTP_FROM}>`,
        to,
        subject: "Password Reset",
        text: `Reset your password: ${resetLink}`,
        html: `<p>Click the link below to reset your password. It expires in 1 hour.</p>
            <p><a href="${resetLink}">${resetLink}</a></p>`,
    });
}