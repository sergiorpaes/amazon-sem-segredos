import nodemailer from 'nodemailer';

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASS
        }
    });
};

const sendGenericEmail = async (to: string, subject: string, htmlContent: string) => {
    const transporter = createTransporter();
    const mailOptions = {
        from: '"Amazon Sem Segredos" <sergiorobertopaes@gmail.com>',
        to,
        subject,
        html: htmlContent
    };

    try {
        console.log(`📧 Enviando e-mail para ${to}... | Assunto: ${subject}`);
        await transporter.sendMail(mailOptions);
        console.log(`✅ E-mail enviado com sucesso para ${to}`);
        return true;
    } catch (error) {
        console.error(`❌ Erro ao enviar e-mail para ${to}:`, error);
        throw error;
    }
};

export const sendWelcomeEmail = async (email: string, activationUrl: string) => {
    const html = `
        to: email,
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
                    This is an automated email. Please do not reply.<br>
                    &copy; 2026 Amazon Sem Segredos IA Suite
                </p>
            </div>
        `;
    return sendGenericEmail(email, '🚀 Ative sua conta - Amazon Sem Segredos AI', html);
};

export const sendEngagementDay1 = async (email: string, name: string) => {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <p>Olá, ${name || 'Vendedor(a)'}!</p>
            <p>Bem-vindo(a) ao Amazon Sem Segredos IA Suite. Sabemos que analisar taxas FBA, calcular impostos e prever lucros em planilhas quebrou a cabeça de muitos vendedores de sucesso.</p>
            <p>O tempo que você gastava tentando adivinhar suas margens de lucro acabou.</p>
            <p>O Amazon Sem Segredos IA Suite consolida tudo o que você precisa em uma única aba.</p>
            <p><strong>Sua missão de hoje:</strong></p>
            <ol>
                <li>Copie o ASIN de um produto que você está de olho.</li>
                <li>Cole na nossa barra de busca mágica.</li>
                <li>Descubra a Margem Líquida Real e o ROI em Segundos.</li>
            </ol>
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://amazon-sem-segredos.netlify.app/dashboard/product-finder" 
                   style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Analisar meu primeiro ASIN
                </a>
            </div>
            <p>Boas vendas,<br>Equipe Amazon Sem Segredos IA Suite</p>
        </div>
    `;
    return sendGenericEmail(email, 'Seu primeiro lucro oculto está te esperando 🕵️‍♂️', html);
};

export const sendEngagementDay2 = async (email: string, name: string) => {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <p>Oi, ${name || 'Vendedor(a)'},</p>
            <p>Você sabia que muitos vendedores iniciantes desistem simplesmente porque ficam paralisados com dúvidas sobre estratégias, bloqueios de conta ou dificuldades em encontrar fornecedores europeus?</p>
            <p>Não precisa ser assim com você.</p>
            <p>O Amazon Sem Segredos IA Suite possui um <strong>Mentor Virtual</strong> inteligente, treinado pelos maiores especialistas do mercado, pronto para te ajudar a qualquer momento. Se você tem dúvidas sobre FBA na Europa, fiscalização, IVA (VAT) ou se não sabe por onde começar, nosso Mentor está online 24 horas por dia.</p>
            <p>Em vez de passar horas pesquisando no Google ou no YouTube, converse com seu mentor particular e tenha respostas diretas, estratégicas e seguras em segundos.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://amazon-sem-segredos.netlify.app/dashboard/mentor" 
                   style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Conversar com o Mentor Virtual
                </a>
            </div>
            <p>Boas vendas,<br>Equipe Amazon Sem Segredos IA Suite</p>
        </div>
    `;
    return sendGenericEmail(email, 'As respostas para destravar suas vendas na Amazon estão aqui 🤖', html);
};

export const sendEngagementDay3 = async (email: string, name: string) => {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <p>${name || 'Vendedor(a)'},</p>
            <p>Se você usou o Amazon Sem Segredos IA Suite nos últimos dias, já percebeu quanto tempo economizou na análise de produtos.</p>
            <p>Automatizar o cálculo do FBA e do ROI já te deu horas livres nesta semana. E com horas livres, você pode focar no que importa: crescimento estratégico.</p>
            <p>Se você está pronto para levar seu negócio na Amazon a sério, o plano <strong>PRO</strong> foi feito para você.</p>
            <p>Com ele, você desbloqueia:</p>
            <ul>
                <li><strong>Criador de Listing turbinado:</strong> Gere imagens em fundo branco super profissionais e 10 bullet points otimizados com IA (em vez de apenas 5).</li>
                <li><strong>Mentor Virtual PRO:</strong> Acesso ilimitado e prioritário à nossa inteligência artificial mais avançada.</li>
                <li><strong>Suporte VIP:</strong> Atendimento direto e em tempo real com o time Amazon Sem Segredos.</li>
            </ul>
            <p>Você não precisa trabalhar mais duro. Trabalhe mais inteligente.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://amazon-sem-segredos.netlify.app/dashboard/settings" 
                   style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Fazer Upgrade para o Plano PRO
                </a>
            </div>
            <p>Boas vendas,<br>Equipe Amazon Sem Segredos IA Suite</p>
        </div>
    `;
    return sendGenericEmail(email, 'Como escalar sem trabalhar 14h por dia 🚀', html);
};

export const sendEngagementDay5 = async (email: string, name: string) => {
    const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <p>${name || 'Vendedor(a)'},</p>
            <p>Sabemos que começar a vender profissionalmente na Amazon é um grande desafio e que dar o passo para um plano de alto nível pode parecer muito no início.</p>
            <p>Se você quer parar de perder tempo em planilhas, mas ainda não precisa de todas as ferramentas ilimitadas, nós temos a solução ideal para você: o nosso <strong>Plano Starter</strong>.</p>
            <p>Ele é perfeito para quem está estruturando o negócio. Com o Starter, você tem a segurança das análises automáticas e acesso diário ao <strong>Mentor Virtual</strong> por um valor extremamente acessível.</p>
            <p>Não deixe a automação para depois. Dê o primeiro passo para profissionalizar sua operação.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://amazon-sem-segredos.netlify.app/dashboard/settings" 
                   style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                    Ativar Meu Plano Starter
                </a>
            </div>
            <p>Boas vendas,<br>Equipe Amazon Sem Segredos IA Suite</p>
        </div>
    `;
    return sendGenericEmail(email, 'O primeiro passo para o seu sucesso na Amazon 🌱', html);
};

