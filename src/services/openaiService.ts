import { ChatMessage } from '../types';

let sessionThreadId: string | null = null;

export const chatWithMentor = async (message: string, history: ChatMessage[]): Promise<string> => {
    try {
        console.log("Sending message with Thread ID:", sessionThreadId);

        // Call Netlify Function for Assistants API
        const response = await fetch('/.netlify/functions/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                threadId: sessionThreadId
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Server Error Response Body:', errorBody);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Save the thread ID for the next message
        if (data.threadId) {
            sessionThreadId = data.threadId;
        }

        return data.response || "Não consegui processar sua mensagem.";
    } catch (error) {
        console.error("CR7 Chat Error:", error);
        return "Desculpe, meu sistema tático está offline. Tente novamente.";
    }
};
