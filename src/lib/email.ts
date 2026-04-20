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
