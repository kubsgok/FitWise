import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
    try {
        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { prompt, systemPrompt, model = 'gemini-2.5-flash', options = {} } = body;

        // Validate prompt
        if (!prompt || typeof prompt !== 'string') {
            return NextResponse.json(
                { error: 'Valid prompt is required' },
                { status: 400 }
            );
        }

        // Prepare model configuration
        const modelConfig = { model };
        
        // Add system instruction if provided
        if (systemPrompt && typeof systemPrompt === 'string') {
            modelConfig.systemInstruction = systemPrompt;
        }

        // Get the generative model with system instruction
        const generativeModel = genAI.getGenerativeModel(modelConfig);

        // Generate content
        const result = await generativeModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: options.temperature || 0.7,
                topK: options.topK || 40,
                topP: options.topP || 0.95,
                maxOutputTokens: options.maxOutputTokens || 2048,
            },
        });

        const response = await result.response;
        const text = response.text();

        return NextResponse.json({
            success: true,
            response: text,
            model: model,
            usage: {
                promptTokens: response.usageMetadata?.promptTokenCount || 0,
                completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: response.usageMetadata?.totalTokenCount || 0,
            }
        });

    } catch (error) {
        console.error('Gemini API Error:', error);
        
        // Handle specific error types
        if (error.status === 400) {
            return NextResponse.json(
                { error: 'Bad request to Gemini API. Please check your prompt.' },
                { status: 400 }
            );
        } else if (error.status === 401) {
            return NextResponse.json(
                { error: 'Invalid API key. Please check your Gemini API key.' },
                { status: 401 }
            );
        } else if (error.status === 429) {
            return NextResponse.json(
                { error: 'Rate limit exceeded. Please try again later.' },
                { status: 429 }
            );
        } else if (error.status === 500) {
            return NextResponse.json(
                { error: 'Internal server error from Gemini API.' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { 
                error: 'Failed to process Gemini request.',
                details: error.message 
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Gemini API endpoint is working. Use POST method to generate content.',
        endpoints: {
            POST: '/api/gemini',
            parameters: {
                prompt: 'string (required) - The text prompt for Gemini',
                systemPrompt: 'string (optional) - System instruction to guide the AI behavior',
                model: 'string (optional) - Model to use (default: gemini-2.5-flash)',
                options: {
                    temperature: 'number (0-1) - Controls randomness',
                    topK: 'number - Controls diversity via top-K sampling',
                    topP: 'number (0-1) - Controls diversity via nucleus sampling',
                    maxOutputTokens: 'number - Maximum tokens in response'
                }
            },
            example: {
                prompt: 'Create a workout plan',
                systemPrompt: 'You are a certified fitness trainer specializing in personalized workout plans.',
                model: 'gemini-2.5-flash',
                options: { temperature: 0.7, maxOutputTokens: 1000 }
            }
        }
    });
}