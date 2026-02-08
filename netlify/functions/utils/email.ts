
import nodemailer from 'nodemailer';

export const sendWelcomeEmail = async (email: string, activationUrl: string) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    });

    const mailOptions = {
        from: '"Amazon Sem Segredos" <sergiorobertopaes@gmail.com>',
        to: email,
        subject: '🚀 Ative sua conta - Amazon Sem Segredos AI',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2563eb; text-align: center;">Bem-vindo ao Amazon Sem Segredos AI!</h2>
                <p>Olá,</p>
                <p>Obrigado por se juntar à nossa plataforma dedicada a impulsionar suas vendas na Amazon com inteligência artificial.</p>
                <p style="font-size: 16px; font-weight: bold; color: #1e40af;">Para começar a usar seus créditos e acessar todas as funcionalidades, por favor ative sua conta clicando no botão abaixo:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${activationUrl}" 
                       style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        ATIVAR MINHA CONTA AGORA
                    </a>
                </div>

                <p style="color: #666; font-size: 14px;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                <p style="color: #666; font-size: 12px; word-break: break-all;">${activationUrl}</p>

                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center;">
                    Este é um e-mail automático. Por favor, não responda.<br>
                    &copy; 2026 Amazon Sem Segredos AI
                </p>
            </div>
        `
    };

    try {
        console.log(`📧 Enviando e-mail real para ${email}...`);
        await transporter.sendMail(mailOptions);
        console.log(`✅ E-mail enviado com sucesso para ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar e-mail via Gmail SMTP:', error);
        throw error;
    }
};
