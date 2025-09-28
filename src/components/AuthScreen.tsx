'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/components/AuthProvider';

interface AuthScreenProps {
    onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
    const [accessKey, setAccessKey] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!accessKey.trim()) {
            setError('Please enter your access key');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const success = await login(accessKey.trim());

            if (success) {
                onAuthenticated();
            } else {
                setError('Invalid access key');
            }
        } catch (error) {
            console.error('Auth error:', error);
            setError('Network error. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-green-100 flex items-center justify-center p-4">
            {/* Background Elements */}
            <div className="absolute inset-0 opacity-15">
                <div className="absolute top-20 left-10 w-12 h-12">
                    <Image src="/kenny-assets/ui/PNG/Green/Default/star.png" alt="" fill className="object-contain" />
                </div>
                <div className="absolute top-40 right-20 w-10 h-10">
                    <Image src="/kenny-assets/ui/PNG/Yellow/Default/star.png" alt="" fill className="object-contain" />
                </div>
                <div className="absolute bottom-32 left-1/4 w-14 h-14">
                    <Image src="/kenny-assets/ui/PNG/Blue/Default/icon_circle.png" alt="" fill className="object-contain" />
                </div>
                <div className="absolute top-1/3 right-10 w-8 h-8">
                    <Image src="/kenny-assets/ui/PNG/Red/Default/icon_square.png" alt="" fill className="object-contain" />
                </div>
            </div>

            <div className="relative z-10 max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="bg-black border-4 border-emerald-400 rounded-none shadow-[12px_12px_0px_0px_#10b981] p-6 mb-6">
                        <h1 className="text-4xl font-black text-white mb-2" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                            VOCALIZER
                        </h1>
                        <p className="text-emerald-400 font-black text-sm" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                            MASTER YOUR VOICE • A PRODUCT BY SPASHT
                        </p>
                    </div>
                </div>

                {/* Auth Form */}
                <div className="bg-white border-4 border-black rounded-none shadow-[12px_12px_0px_0px_#000000] p-8">
                    <h2 className="text-2xl font-black text-black mb-6 text-center" style={{ fontFamily: 'Kenney Future, sans-serif' }}>
                        ENTER ACCESS KEY
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-lg font-black text-black mb-3" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                ACCESS KEY:
                            </label>
                            <input
                                type="text"
                                value={accessKey}
                                onChange={(e) => setAccessKey(e.target.value)}
                                placeholder="Enter your access key..."
                                className="w-full border-2 border-black px-4 py-3 rounded-none text-black font-medium text-lg focus:outline-none focus:border-emerald-500"
                                style={{ fontFamily: 'Kenney Future Narrow, monospace' }}
                                disabled={isLoading}
                                autoFocus
                            />
                            <p className="text-gray-600 text-sm mt-2">
                                Your access key is provided by the external application that grants you access to this speech training platform.
                            </p>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-100 border-2 border-red-400 rounded-none p-4">
                                <p className="text-red-800 font-black text-sm" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                                    ⚠️ {error}
                                </p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || !accessKey.trim()}
                            className={`w-full border-2 border-black py-4 rounded-none shadow-[4px_4px_0px_0px_#000000] transition-all hover:shadow-[6px_6px_0px_0px_#000000] font-black text-xl ${isLoading || !accessKey.trim()
                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                }`}
                            style={{ fontFamily: 'Kenney Future, sans-serif' }}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                    VALIDATING...
                                </span>
                            ) : (
                                'START TRAINING →'
                            )}
                        </button>
                    </form>



                </div>
            </div>
        </div>
    );
}
