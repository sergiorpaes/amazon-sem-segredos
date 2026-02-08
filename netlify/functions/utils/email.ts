
export const sendWelcomeEmail = async (email: string, activationUrl: string) => {
    // This is a placeholder for a real email service like Resend, SendGrid, or AWS SES.
    // For now, we will log the email to the console to simulate sending.

    console.log(`
    --------------------------------------------------
    📧 ENVIANDO EMAIL DE BOAS-VINDAS:
    Para: ${email}
    Assunto: Bem-vindo ao Amazon Sem Segredos AI!
    
    Olá! Obrigado por se cadastrar.
    Para ativar sua conta e começar a usar seus créditos, 
    por favor clique no link abaixo:
    
    ${activationUrl}
    
    Se você não solicitou este cadastro, por favor ignore este email.
    --------------------------------------------------
    `);

    // In a real implementation, you would use something like:
    /*
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
        from: 'Amazon Sem Segredos <onboarding@yourdomain.com>',
        to: email,
        subject: 'Bem-vindo ao Amazon Sem Segredos AI!',
        html: `...`
    });
    */

    return true;
};
