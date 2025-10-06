'use client';

interface WaveformVisualizationProps {
    waveformData: number[];
    isRecording: boolean;
    isBossLevel: boolean;
}

export default function WaveformVisualization({
    waveformData,
    isRecording,
    isBossLevel
}: WaveformVisualizationProps) {
    return (
        <div className={`bg-black border-2 p-6 rounded-none mb-6 ${isBossLevel ? 'border-red-400' : 'border-emerald-400'}`}>
            <div className="flex items-end justify-center space-x-1 h-32">
                {waveformData.map((height, index) => (
                    <div
                        key={index}
                        className={`w-2 transition-all duration-200 ${isRecording ? 'animate-pulse' : ''} ${isBossLevel ? 'bg-red-400' : 'bg-emerald-400'}`}
                        style={{ height: `${height}%` }}
                    />
                ))}
            </div>
            <div className="text-center mt-4">
                <span className={`font-black text-sm ${isBossLevel ? 'text-red-400' : 'text-emerald-400'}`} style={{ fontFamily: 'Kenney Future Narrow, monospace' }}>
                    {isRecording ? 'RECORDING...' : 'READY TO RECORD'}
                </span>
            </div>
        </div>
    );
}



