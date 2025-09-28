'use client';

interface LevelSetupProps {
    showInterviewSetup: boolean;
    interviewType: string;
    jobRole: string;
    error: string | null;
    troubleshootingSteps: string[];
    onInterviewTypeChange: (type: string) => void;
    onJobRoleChange: (role: string) => void;
    onStopInterview: () => void;
    showChatInterface: boolean;
}

export default function LevelSetup({
    showInterviewSetup,
    interviewType,
    jobRole,
    error,
    troubleshootingSteps,
    onInterviewTypeChange,
    onJobRoleChange,
    onStopInterview,
    showChatInterface
}: LevelSetupProps) {
    if (!showInterviewSetup) return null;

    return (
        <div className="bg-gray-100 border-2 border-black p-6 rounded-none mb-6">
            <div className="space-y-6">
                {/* Interview Type Selection */}
                <div>
                    <label className="block text-lg font-black text-black mb-3" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                        INTERVIEW TYPE:
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                            { value: 'technical', label: 'Technical Interview', desc: 'Coding problems, system design' },
                            { value: 'behavioral', label: 'Behavioral Interview', desc: 'Past experiences, teamwork' },
                            { value: 'case-study', label: 'Case Study Interview', desc: 'Business scenarios, problem-solving' }
                        ].map((type) => (
                            <button
                                key={type.value}
                                onClick={() => onInterviewTypeChange(type.value)}
                                className={`border-2 border-black p-4 rounded-none text-left transition-colors ${interviewType === type.value
                                    ? 'bg-red-400 text-white'
                                    : 'bg-white text-black hover:bg-gray-100'
                                    }`}
                                style={{ fontFamily: 'Kenney Future Narrow, monospace' }}
                            >
                                <div className="font-black text-sm mb-1">{type.label.toUpperCase()}</div>
                                <div className="text-xs opacity-75">{type.desc}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Job Role Selection */}
                <div>
                    <label className="block text-lg font-black text-black mb-3" style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                        JOB ROLE:
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer',
                            'Marketing Manager', 'Sales Rep', 'Project Manager', 'Business Analyst'
                        ].map((role) => (
                            <button
                                key={role}
                                onClick={() => onJobRoleChange(role)}
                                className={`border-2 border-black p-3 rounded-none text-center transition-colors ${jobRole === role
                                    ? 'bg-red-400 text-white'
                                    : 'bg-white text-black hover:bg-gray-100'
                                    }`}
                                style={{ fontFamily: 'Kenney Future Narrow, monospace' }}
                            >
                                <div className="font-black text-xs">{role.toUpperCase()}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Selection Summary */}
                {(interviewType && jobRole) && (
                    <div className="bg-white border-2 border-black p-4 rounded-none">
                        <div className="text-center">
                            <p className="text-black font-medium mb-2">
                                Ready for: <span className="font-black">{interviewType.toUpperCase()} INTERVIEW</span>
                            </p>
                            <p className="text-black font-medium">
                                Position: <span className="font-black">{jobRole.toUpperCase()}</span>
                            </p>
                            <p className="text-sm text-gray-600 mt-2 mb-4">
                                Click the record button below to begin your VAPI AI interview session!
                            </p>
                            {showChatInterface && (
                                <button
                                    onClick={onStopInterview}
                                    className="bg-red-500 hover:bg-red-600 border-2 border-black px-4 py-2 rounded-none shadow-[2px_2px_0px_0px_#000000] transition-all hover:shadow-[4px_4px_0px_0px_#000000] text-white font-black text-sm"
                                    style={{ fontFamily: 'Kenney Future Narrow, monospace' }}
                                >
                                    END INTERVIEW
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

