import OpenAI from 'openai';

export const handler = async (event: any) => {
    // Handle CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        console.log('--- Chat Function (Assistants API) Start ---');
        console.log('HTTP Method:', event.httpMethod);

        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is missing');
        }

        if (!process.env.OPENAI_ASSISTANT_ID) {
            throw new Error('OPENAI_ASSISTANT_ID is missing in .env.local');
        }

        const body = JSON.parse(event.body || '{}');
        const { message, threadId, instructions } = body;

        console.log('Received Message:', message);
        console.log('Received ThreadID:', threadId);
        if (instructions) console.log('Received Instructions Override');

        if (!message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Message is required' })
            };
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });

        // 1. Get or Create Thread
        let currentThreadId = threadId;
        if (!currentThreadId) {
            console.log('Creating new Thread...');
            const thread = await openai.beta.threads.create();
            currentThreadId = thread.id;
        }
        console.log('Using Thread ID:', currentThreadId);

        // 2. Add Message to Thread
        await openai.beta.threads.messages.create(
            currentThreadId,
            { role: "user", content: message }
        );

        // 3. Run Assistant
        console.log('Starting Run with Assistant ID:', process.env.OPENAI_ASSISTANT_ID);
        const runOptions: any = { assistant_id: process.env.OPENAI_ASSISTANT_ID };
        if (instructions) {
            runOptions.instructions = instructions;
        }

        const run = await openai.beta.threads.runs.create(
            currentThreadId,
            runOptions
        );

        // 4. Poll for Completion
        let runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);

        while (runStatus.status !== 'completed') {
            if (['failed', 'cancelled', 'expired'].includes(runStatus.status)) {
                throw new Error(`Run failed with status: ${runStatus.status}`);
            }
            // Wait 1 second
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(currentThreadId, run.id);
        }

        // 5. Get Messages
        const messages = await openai.beta.threads.messages.list(currentThreadId);

        // 6. Extract latest assistant response
        const lastMessage = messages.data
            .filter(msg => msg.role === 'assistant')
            .shift();

        let responseText = "Sem resposta do assistente.";
        if (lastMessage && lastMessage.content[0].type === 'text') {
            responseText = lastMessage.content[0].text.value;
        }

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                response: responseText,
                threadId: currentThreadId
            })
        };

    } catch (error: any) {
        console.error('CRITICAL ERROR in Chat Function:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Internal Server Error',
                message: error.message
            })
        };
    } finally {
        console.log('--- Chat Function End ---');
    }
};
