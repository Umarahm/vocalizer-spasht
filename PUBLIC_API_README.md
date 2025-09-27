# Speech Game Public API

This API provides read-only access to Speech Game data for external websites and applications. All endpoints are CORS-enabled and require no authentication.

## Base URL
```
https://your-domain.com/api/public
```

## Endpoints

### 1. API Overview
**GET** `/api/public`

Returns information about all available public endpoints.

### 2. Game Statistics
**GET** `/api/public/stats`

Returns comprehensive game statistics and analytics.

**Response:**
```json
{
  "overview": {
    "total_users": 1250,
    "active_users": 892,
    "new_users_24h": 23,
    "active_users_24h": 156,
    "total_sessions": 5432,
    "users_with_progress": 789
  },
  "performance": {
    "successful_attempts": 4521,
    "average_score": 78.5,
    "average_accuracy": 0.82,
    "average_fluency": 0.75,
    "average_wpm": 145.2,
    "total_coins_earned": 125000,
    "total_xp_earned": 890000
  },
  "levels": {
    "levels_attempted": 21,
    "levels_completed": 18,
    "highest_level_reached": 20
  },
  "sessions": {
    "total_game_sessions": 2341,
    "average_session_time_seconds": 420,
    "longest_session_seconds": 1800,
    "average_levels_per_session": 2.1
  },
  "level_completion_breakdown": [...],
  "recent_activity": [...]
}
```

### 3. Level Information
**GET** `/api/public/levels`

Returns information about all game levels.

**Query Parameters:**
- `difficulty` (optional): Filter by difficulty (`easy`, `medium`, `hard`)
- `type` (optional): Filter by type (`basic`, `intermediate`, `advanced`, `boss`)
- `includeBossLevels` (optional): Include boss levels (`true`/`false`, default: `true`)

**Examples:**
- `GET /api/public/levels` - All levels
- `GET /api/public/levels?difficulty=easy` - Easy levels only
- `GET /api/public/levels?type=boss` - Boss levels only

**Response:**
```json
{
  "total_levels": 21,
  "filtered_count": 7,
  "filters_applied": {
    "difficulty": "easy",
    "type": "all",
    "include_boss_levels": true
  },
  "levels": [
    {
      "id": 1,
      "level": 1,
      "name": "Greetings Master",
      "difficulty": "easy",
      "type": "basic",
      "isBossLevel": false,
      "prompt": "Hello! Good morning everyone...",
      "backgroundImage": "/kenny-assets/backgrounds/...",
      "speechBubbleText": "LEVEL 1: Master everyday greetings!...",
      "rewardCoins": 25,
      "rewardXP": 50,
      "timeLimit": 25,
      "description": "Learn to greet others confidently...",
      "skills": ["Intonation", "Social Communication", "Confidence"],
      "image": null
    }
  ]
}
```

### 4. Leaderboard
**GET** `/api/public/leaderboard`

Returns top players ranked by various criteria.

**Query Parameters:**
- `limit` (optional): Number of results (max 50, default: 10)
- `sortBy` (optional): Sort criteria (`xp`, `coins`, `levels`, `streak`; default: `xp`)
- `timeframe` (optional): Time period (`all`, `month`, `week`; default: `all`)

**Examples:**
- `GET /api/public/leaderboard` - Top 10 by XP (all time)
- `GET /api/public/leaderboard?limit=20&sortBy=coins` - Top 20 by coins
- `GET /api/public/leaderboard?timeframe=week&sortBy=levels` - Weekly top players by levels completed

**Response:**
```json
{
  "metadata": {
    "sort_by": "xp",
    "sort_label": "Total XP",
    "timeframe": "all",
    "timeframe_label": "All Time",
    "limit": 10,
    "total_results": 10
  },
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "user_1234",
      "joined_date": "2025-01-15",
      "last_active": "2025-09-27",
      "stats": {
        "total_coins": 15420,
        "total_xp": 89500,
        "current_level": 18,
        "current_streak": 12,
        "best_streak": 25,
        "total_sessions": 45,
        "total_time_seconds": 12600,
        "levels_completed": 17,
        "average_score": 85.2,
        "average_accuracy": 0.88,
        "average_fluency": 0.82,
        "average_words_per_minute": 152.5
      }
    }
  ]
}
```

## Usage Examples

### JavaScript/Fetch
```javascript
// Get game statistics
fetch('https://your-domain.com/api/public/stats')
  .then(response => response.json())
  .then(data => console.log(data));

// Get easy levels
fetch('https://your-domain.com/api/public/levels?difficulty=easy')
  .then(response => response.json())
  .then(data => console.log(data.levels));

// Get top 20 leaderboard by coins
fetch('https://your-domain.com/api/public/leaderboard?limit=20&sortBy=coins')
  .then(response => response.json())
  .then(data => console.log(data.leaderboard));
```

### HTML/JavaScript Widget
```html
<div id="speech-game-stats"></div>

<script>
fetch('https://your-domain.com/api/public/stats')
  .then(response => response.json())
  .then(data => {
    const statsDiv = document.getElementById('speech-game-stats');
    statsDiv.innerHTML = `
      <h3>Speech Game Statistics</h3>
      <p>Total Users: ${data.overview.total_users}</p>
      <p>Active Today: ${data.overview.active_users_24h}</p>
      <p>Average Score: ${data.performance.average_score.toFixed(1)}%</p>
    `;
  });
</script>
```

## CORS Support

All endpoints include CORS headers to allow cross-origin requests:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## Rate Limiting

Standard rate limiting applies to prevent abuse. Consider implementing client-side caching for better performance.

## Data Privacy

- User IDs are anonymized (only last 4 digits shown)
- Personal information is not exposed
- Only aggregate statistics and public level data are available

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `500`: Server error

Error responses include a JSON object with an `error` field describing the issue.
