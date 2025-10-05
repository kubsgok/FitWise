'use client';

import { useState } from 'react';

export default function GeminiTest() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const testGeminiAPI = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setLoading(true);
        setError('');
        setResponse('');

        try {
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: 'gemini-pro',
                    options: {
                        temperature: 0.7,
                        maxOutputTokens: 1000,
                    }
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            setResponse(data.response);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const checkAPIStatus = async () => {
        try {
            const res = await fetch('/api/gemini');
            const data = await res.json();
            console.log('API Status:', data);
            alert('Check console for API status');
        } catch (err) {
            console.error('API check failed:', err);
            alert('API check failed - see console');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Gemini API Test</h1>
                
                <div className="space-y-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                            Enter your prompt:
                        </label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={4}
                            placeholder="Ask Gemini anything... (e.g., 'Explain machine learning in simple terms')"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={testGeminiAPI}
                            disabled={loading}
                            className={`px-6 py-2 rounded-md text-white font-medium ${
                                loading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
                            }`}
                        >
                            {loading ? 'Generating...' : 'Send to Gemini'}
                        </button>

                        <button
                            onClick={checkAPIStatus}
                            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
                        >
                            Check API Status
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <div className="text-red-600">
                                    <strong>Error:</strong> {error}
                                </div>
                            </div>
                            {error.includes('API key') && (
                                <div className="mt-2 text-sm text-red-600">
                                    <p>To fix this:</p>
                                    <ol className="list-decimal list-inside mt-1 space-y-1">
                                        <li>Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
                                        <li>Add it to your <code className="bg-red-100 px-1 rounded">.env.local</code> file as <code className="bg-red-100 px-1 rounded">GEMINI_API_KEY=your_key_here</code></li>
                                        <li>Restart your Next.js development server</li>
                                    </ol>
                                </div>
                            )}
                        </div>
                    )}

                    {response && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                            <h3 className="text-lg font-semibold text-green-800 mb-2">Gemini Response:</h3>
                            <div className="text-green-700 whitespace-pre-wrap">{response}</div>
                        </div>
                    )}

                    {loading && (
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                <span className="text-blue-700">Gemini is thinking...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Usage Examples:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• "Write a short story about a robot learning to paint"</li>
                    <li>• "Explain quantum computing to a 10-year-old"</li>
                    <li>• "Generate a workout plan for beginners"</li>
                    <li>• "What are the benefits of meditation?"</li>
                </ul>
            </div>
        </div>
    );
}