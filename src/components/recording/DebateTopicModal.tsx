'use client';

interface DebateTopicModalProps {
    showDebateSetup: boolean;
    debateTopic: string;
    debatePosition: 'pro' | 'con' | '';
    error: string | null;
    troubleshootingSteps: string[];
    onDebateTopicChange: (topic: string) => void;
    onDebatePositionChange: (position: 'pro' | 'con') => void;
    onStopDebate: () => void;
    showChatInterface: boolean;
}

export default function DebateTopicModal({
    showDebateSetup,
    debateTopic,
    debatePosition,
    error,
    troubleshootingSteps,
    onDebateTopicChange,
    onDebatePositionChange,
    onStopDebate,
    showChatInterface
}: DebateTopicModalProps) {
    if (!showDebateSetup) return null;

    const debateTopics = [
        {
            value: 'climate-change',
            label: 'Climate Change Action',
            description: 'Should governments implement stricter climate policies?'
        },
        {
            value: 'artificial-intelligence',
            label: 'AI Regulation',
            description: 'Should AI development be heavily regulated by governments?'
        },
        {
            value: 'universal-basic-income',
            label: 'Universal Basic Income',
            description: 'Should countries implement universal basic income?'
        },
        {
            value: 'social-media-regulation',
            label: 'Social Media Censorship',
            description: 'Should social media platforms be required to censor harmful content?'
        },
        {
            value: 'space-exploration',
            label: 'Space Exploration Priority',
            description: 'Should space exploration be prioritized over solving Earth problems?'
        },
        {
            value: 'cryptocurrency',
            label: 'Cryptocurrency Adoption',
            description: 'Should governments adopt cryptocurrency as legal tender?'
        },
        {
            value: 'remote-work',
            label: 'Remote Work Future',
            description: 'Should remote work become the default for most jobs?'
        },
        {
            value: 'animal-testing',
            label: 'Animal Testing Ban',
            description: 'Should animal testing for cosmetics be completely banned?'
        }
    ];

    return (
        <div className="bg-gray-100 border-2 border-black p-6 rounded-none mb-6">
            <div className="space-y-6">
                {/* Debate Topic Selection */}
                <div>
                    <label className="block text-lg font-black text-black mb-3" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                        DEBATE TOPIC:
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {debateTopics.map((topic) => (
                            <button
                                key={topic.value}
                                onClick={() => onDebateTopicChange(topic.value)}
                                className={`border-2 border-black p-4 rounded-none text-left transition-colors ${debateTopic === topic.value
                                        ? 'bg-red-400 text-white'
                                        : 'bg-white text-black hover:bg-gray-100'
                                    }`}
                                style={{ fontFamily: 'Kenney Future Narrow, monospace' }}
                            >
                                <div className="font-black text-sm mb-1">{topic.label.toUpperCase()}</div>
                                <div className="text-xs opacity-75">{topic.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Debate Position Selection */}
                <div>
                    <label className="block text-lg font-black text-black mb-3" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                        YOUR POSITION:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { value: 'pro', label: 'PRO (For)', desc: 'Argue in favor of the topic' },
                            { value: 'con', label: 'CON (Against)', desc: 'Argue against the topic' }
                        ].map((position) => (
                            <button
                                key={position.value}
                                onClick={() => onDebatePositionChange(position.value as 'pro' | 'con')}
                                className={`border-2 border-black p-4 rounded-none text-left transition-colors ${debatePosition === position.value
                                        ? 'bg-red-400 text-white'
                                        : 'bg-white text-black hover:bg-gray-100'
                                    }`}
                                style={{ fontFamily: 'Kenney Future Narrow, monospace' }}
                            >
                                <div className="font-black text-sm mb-1">{position.label.toUpperCase()}</div>
                                <div className="text-xs opacity-75">{position.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selection Summary */}
                {(debateTopic && debatePosition) && (
                    <div className="bg-white border-2 border-black p-4 rounded-none">
                        <div className="text-center">
                            <p className="text-black font-medium mb-2">
                                Ready for: <span className="font-black">DEBATE CHAMPION</span>
                            </p>
                            <p className="text-black font-medium mb-2">
                                Topic: <span className="font-black">
                                    {debateTopics.find(t => t.value === debateTopic)?.label.toUpperCase()}
                                </span>
                            </p>
                            <p className="text-black font-medium mb-2">
                                Position: <span className="font-black">{debatePosition.toUpperCase()}</span>
                            </p>
                            <p className="text-sm text-gray-600 mt-2 mb-4">
                                Click the record button below to begin your 3-minute debate session with AI!
                            </p>
                            <div className="bg-red-50 border border-red-200 p-3 rounded-none mb-4">
                                <p className="text-red-800 text-sm font-medium">
                                    ⚠️ DEBATE RULES: 3-minute time limit. AI will argue the opposite position.
                                    Points awarded for argument quality, speaking time, and fluency.
                                </p>
                            </div>
                            {showChatInterface && (
                                <button
                                    onClick={onStopDebate}
                                    className="bg-red-500 hover:bg-red-600 border-2 border-black px-4 py-2 rounded-none shadow-[2px_2px_0px_0px_#000000] transition-all hover:shadow-[4px_4px_0px_0px_#000000] text-white font-black text-sm"
                                    style={{ fontFamily: 'Kenney Future Narrow, monospace' }}
                                >
                                    END DEBATE
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Error Troubleshooting Section */}
                {error && troubleshootingSteps.length > 0 && (
                    <div className="bg-red-50 border-2 border-red-300 p-4 rounded-none mt-4">
                        <h4 className="text-red-800 font-black text-sm mb-3" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                            🔧 TROUBLESHOOTING STEPS:
                        </h4>
                        <ul className="space-y-2">
                            {troubleshootingSteps.map((step, index) => (
                                <li key={index} className="text-red-700 text-sm flex items-start">
                                    <span className="font-bold mr-2">{index + 1}.</span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-3 pt-3 border-t border-red-200">
                            <p className="text-red-600 text-xs">
                                💡 Need help? Check the browser console for detailed error logs.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}



