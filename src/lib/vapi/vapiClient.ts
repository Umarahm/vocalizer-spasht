// VAPI Client Wrapper for Speech Game Integration
// Using actual VAPI Web SDK

import Vapi from '@vapi-ai/web';

export interface VapiAssistant {
    name: string;
    model: {
        provider: string;
        model: string;
        temperature: number;
        systemMessage: string;
    };
    voice: {
        provider: string;
        voiceId: string;
    };
}

export interface VapiConfig {
    apiKey: string;
    assistant: VapiAssistant;
    interviewType?: string;
    jobRole?: string;
}

export class VapiClient {
    private vapi: Vapi;
    private config: VapiConfig;
    private eventListeners: { [event: string]: Function[] } = {};
    private _isActive = false;

    constructor(config: VapiConfig) {
        this.config = config;
        this.vapi = new Vapi(config.apiKey);
        this.setupEventListeners();
    }

    private setupEventListeners() {
        // Initialize event listener arrays
        this.eventListeners = {
            connected: [],
            disconnected: [],
            'speech-start': [],
            'speech-end': [],
            message: [],
            error: []
        };

        // Set up VAPI event listeners
        this.vapi.on('call-start', () => {
            console.log('VAPI call started');
            this._isActive = true;
            this.emit('connected');
        });

        this.vapi.on('call-end', () => {
            console.log('VAPI call ended');
            this._isActive = false;
            this.emit('disconnected');
        });

        this.vapi.on('speech-start', () => {
            console.log('VAPI speech started');
            this.emit('speech-start');
        });

        this.vapi.on('speech-end', () => {
            console.log('VAPI speech ended');
            this.emit('speech-end');
        });

        this.vapi.on('message', (message: any) => {
            console.log('VAPI message received:', message);

            // Handle different message types
            if (message.type === 'transcript' && message.transcript) {
                this.emit('message', {
                    type: 'transcript',
                    role: message.role || 'assistant',
                    content: message.transcript
                });
            } else if (message.type === 'function-call') {
                console.log('Function call:', message);
            } else if (message.type === 'conversation-update') {
                // Handle conversation updates if needed
                console.log('Conversation update:', message);
            }
        });

        this.vapi.on('error', (error: any) => {
            console.error('VAPI Error:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));

            // Provide more specific error messages
            let errorMessage = 'VAPI connection error';
            if (error?.message) {
                errorMessage = error.message;
            } else if (error?.code) {
                switch (error.code) {
                    case 'INVALID_API_KEY':
                        errorMessage = 'Invalid VAPI API key. Please check your NEXT_PUBLIC_VAPI_API_KEY.';
                        break;
                    case 'ASSISTANT_NOT_FOUND':
                        errorMessage = 'Assistant not found. Please check your assistant ID in vapiClient.ts.';
                        break;
                    case 'NETWORK_ERROR':
                        errorMessage = 'Network error. Please check your internet connection.';
                        break;
                    default:
                        errorMessage = `VAPI Error (${error.code}): ${error.message || 'Unknown error'}`;
                }
            }

            this.emit('error', { message: errorMessage, originalError: error });
        });

        // Additional VAPI events can be added here as needed
    }

    on(event: string, callback: Function) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }

    private emit(event: string, data?: any) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} event listener:`, error);
                }
            });
        }
    }

    async start(assistantId?: string): Promise<void> {
        try {
            console.log('Starting VAPI interview session...');
            console.log('Using API key:', this.config.apiKey ? '***' + this.config.apiKey.slice(-4) : 'NOT SET');

            // Start with the configured assistant and dynamic interview context
            const defaultAssistantId = '43df149e-0414-483a-84d6-3f9aac941483';
            const finalAssistantId = assistantId || defaultAssistantId;

            console.log('Connecting to VAPI assistant:', finalAssistantId);

            // For debates, use the pre-configured assistant from VAPI dashboard
            if (this.config.interviewType === 'debate') {
                console.log('Debate mode detected - using VAPI dashboard assistant configuration');
                await this.vapi.start(finalAssistantId);
            } else {
                // For interviews, create dynamic system message
                const interviewTypeDisplay = this.config.interviewType || 'general';
                const jobRoleDisplay = this.config.jobRole || 'professional';
                const dynamicSystemMessage = `You are a professional interviewer conducting a ${interviewTypeDisplay} interview for a ${jobRoleDisplay} position. Ask relevant questions, listen carefully, and provide thoughtful follow-up questions. Keep the conversation natural and engaging. Start with a greeting and introduction question. Be professional, encouraging, and provide constructive feedback when appropriate.`;

                console.log('Interview context - Type:', interviewTypeDisplay, 'Role:', jobRoleDisplay);
                console.log('Dynamic system message:', dynamicSystemMessage.substring(0, 100) + '...');

                // Start with the assistant ID and let VAPI use the configured assistant
                // The system message override might not be supported in this version
                await this.vapi.start(finalAssistantId);
            }

            console.log('VAPI interview session started successfully');

        } catch (error) {
            console.error('VAPI start error:', error);

            // Provide more helpful error messages
            let userFriendlyError = 'Failed to start VAPI interview session.';

            if (error instanceof Error) {
                if (error.message.includes('API key')) {
                    userFriendlyError = 'Invalid VAPI API key. Please check your NEXT_PUBLIC_VAPI_API_KEY in .env.local.';
                } else if (error.message.includes('assistant')) {
                    userFriendlyError = 'Assistant not found. Please create an assistant in VAPI dashboard and update the assistant ID in vapiClient.ts.';
                } else if (error.message.includes('network') || error.message.includes('fetch')) {
                    userFriendlyError = 'Network error. Please check your internet connection and try again.';
                } else {
                    userFriendlyError = error.message;
                }
            }

            const enhancedError = {
                message: userFriendlyError,
                originalError: error,
                troubleshooting: [
                    '1. Check that NEXT_PUBLIC_VAPI_API_KEY is set in .env.local',
                    '2. Create an assistant in VAPI dashboard (https://dashboard.vapi.ai)',
                    '3. Replace "your-assistant-id" in vapiClient.ts with your actual assistant ID',
                    '4. Make sure your VAPI account has credits and is active'
                ]
            };

            this.emit('error', enhancedError);
            throw error;
        }
    }

    async stop(): Promise<void> {
        try {
            console.log('Stopping VAPI interview session...');
            await this.vapi.stop();
        } catch (error) {
            console.error('Error stopping VAPI:', error);
        }
    }

    sendMessage(message: string) {
        // For VAPI, messages are handled through speech input automatically
        // This method is kept for compatibility but VAPI handles conversation flow automatically
        console.log('Message would be sent to VAPI:', message);
    }

    get isConnected(): boolean {
        return this._isActive;
    }

    get isActive(): boolean {
        return this._isActive;
    }
}
