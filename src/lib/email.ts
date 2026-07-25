import { Resend } from 'resend';

export async function sendPasswordResetEmail(to: string, resetLink: string) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
        from: 'MultivRSS <noreply@multivrss.com>',
        to: [to],
        subject: 'Password Reset',
        html: `<p>Click the link below to reset your password. It expires in 1 hour.</p>
               <p><a href="${resetLink}">${resetLink}</a></p>`,
        text: `Reset your password: ${resetLink}`,
    });

    if (error) throw new Error(error.message);
}

export async function sendVerificationEmail(email: string, token: string, callbackUrl?: string) {
    const verifyUrl = callbackUrl
        ? `${process.env.NEXTAUTH_URL}/verify-email?token=${token}&callbackUrl=${encodeURIComponent(callbackUrl)}`
        : `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
        from: 'MultivRSS <noreply@multivrss.com>',
        to: email,
        subject: 'Verify your email · MultivRSS',
        html: `
            <p>Thanks for signing up.</p>
            <p><a href="${verifyUrl}">Verify your email address</a></p>
            <p>This link expires in 24 hours.</p>
            <p>If you did not create an account, ignore this email.</p>
        `,
    });
}
