import { NextRequest, NextResponse } from 'next/server';
import { levels } from '@/data/levels';

export async function GET(request: NextRequest) {
    try {
        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const difficulty = searchParams.get('difficulty'); // 'easy', 'medium', 'hard'
        const type = searchParams.get('type'); // 'basic', 'intermediate', 'advanced', 'boss'
        const includeBossLevels = searchParams.get('includeBossLevels') !== 'false'; // Default true

        let filteredLevels = [...levels];

        // Filter by difficulty if specified
        if (difficulty) {
            filteredLevels = filteredLevels.filter(level => level.difficulty === difficulty);
        }

        // Filter by type if specified
        if (type) {
            filteredLevels = filteredLevels.filter(level => level.type === type);
        }

        // Filter out boss levels if not requested
        if (!includeBossLevels) {
            filteredLevels = filteredLevels.filter(level => !level.isBossLevel);
        }

        // Transform levels for public API (remove internal fields if needed)
        const publicLevels = filteredLevels.map(level => ({
            id: level.id,
            level: level.level,
            name: level.name,
            difficulty: level.difficulty,
            type: level.type,
            isBossLevel: level.isBossLevel,
            prompt: level.prompt,
            backgroundImage: level.backgroundImage,
            speechBubbleText: level.speechBubbleText,
            rewardCoins: level.rewardCoins,
            rewardXP: level.rewardXP,
            timeLimit: level.timeLimit,
            description: level.description,
            skills: level.skills,
            image: level.image // Include visual challenge images if available
        }));

        const response = {
            total_levels: levels.length,
            filtered_count: publicLevels.length,
            filters_applied: {
                difficulty: difficulty || 'all',
                type: type || 'all',
                include_boss_levels: includeBossLevels
            },
            levels: publicLevels
        };

        // Add CORS headers for cross-origin access
        return NextResponse.json(response, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });

    } catch (error) {
        console.error('Error fetching public levels:', error);
        return NextResponse.json(
            { error: 'Failed to fetch levels' },
            {
                status: 500,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                },
            }
        );
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}

