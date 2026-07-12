'use server';

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";
import { PASSWORD_REGEX } from "@/lib/utils";
import crypto from "crypto";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { headers } from "next/headers";
import type { ActionState } from "./types";

// action to create user
export async function registerUser(prevState: string | null, formData: FormData): Promise<string | null> {
    const email = formData.get("email") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    const hdrs = await headers();
    const ip = getClientIp(hdrs);
    if (!await checkRateLimit(`register:${ip}`, { maxRequests: 3, windowMs: 60 * 60 * 1000 })) {
        return "Too many registration attempts. Please try again later.";
    }

    try {
        if (!PASSWORD_REGEX.test(password)) {
            return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
        }
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: { email, username, password: hashed },
        });

        const token = crypto.randomBytes(32).toString('hex');
        await prisma.emailVerificationToken.create({
            data: {
                userId: user.id,
                token,
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });

        sendVerificationEmail(email, token).catch((err: unknown) => {
            console.error('Failed to send verification email:', err);
        });
    } catch {
        return "Registration failed. Email or username already taken.";
    }

    redirect("/verify-email/sent");
    ;
}

export async function resendVerificationEmail(
    prevState: ActionState | null,
    formData: FormData,
): Promise<ActionState> {
    const email = (formData.get('email') as string)?.trim().toLowerCase();
    if (!email) return { success: false, message: 'Email is required.' };

    const hdrs = await headers();
    const ip = getClientIp(hdrs);
    if (!await checkRateLimit(`resend-verification:${ip}`, { maxRequests: 3, windowMs: 60 * 60 * 1000 })) {
        return { success: true, message: "If that email matches an unverified account, a new link is on its way." };
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (user && !user.emailVerified) {
            await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });

            const token = crypto.randomBytes(32).toString('hex');
            await prisma.emailVerificationToken.create({
                data: { userId: user.id, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
            });

            sendVerificationEmail(email, token).catch((err: unknown) => {
                console.error('Failed to resend verification email:', err);
            });
        }
    } catch (error) {
        console.error('Resend verification error:', error);
    }

    return { success: true, message: "If that email matches an unverified account, a new link is on its way." };
}

export async function requestPasswordReset(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const email = formData.get("email") as string;
    if (!email) return { success: false, message: "Email is required." };

    const hdrs = await headers();
    const ip = getClientIp(hdrs);
    if (!await checkRateLimit(`password-reset:${ip}`, { maxRequests: 3, windowMs: 60 * 60 * 1000 })) {
        return { success: true, message: "If that email is registered, you'll receive a reset link shortly." };
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (user) {
            // Delete any existing tokens for this user
            await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

            const token = crypto.randomBytes(32).toString("hex");
            const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

            await prisma.passwordResetToken.create({
                data: { userId: user.id, token, expires },
            });

            const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
            await sendPasswordResetEmail(email, resetLink);
        }
    } catch (error) {
        console.error("Password reset request error:", error);
    }

    // Always return the same message — never reveal if the email is registered
    return { success: true, message: "If that email is registered, you'll receive a reset link shortly." };
}

export async function resetPassword(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (!token || !password || !confirm) return { success: false, message: "All fields are required." };
    if (password !== confirm) return { success: false, message: "Passwords do not match." };

    if (!PASSWORD_REGEX.test(password)) {
        return { success: false, message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character." };
    }

    try {
        const record = await prisma.passwordResetToken.findUnique({ where: { token } });

        if (!record || record.expires < new Date()) {
            return { success: false, message: "This reset link is invalid or has expired." };
        }

        const hashed = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: record.userId },
            data: { password: hashed },
        });

        await prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } });

        return { success: true, message: "Password updated successfully." };
    } catch (error) {
        console.error("Password reset error:", error);
        return { success: false, message: "Something went wrong. Please try again." };
    }
}
