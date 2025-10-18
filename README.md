# Speech Game - Neon DB Integration

A gamified speech training application with AI-powered analysis and progress tracking, now integrated with Neon DB for secure user data management.

## Features

- 🎯 **Access Key Authentication**: Secure authentication using access keys from external applications
- 🗄️ **Neon DB Integration**: PostgreSQL database for user progress, sessions, and statistics
- 🎮 **Gamified Learning**: Progressive levels with rewards and achievements
- 🤖 **AI Speech Analysis**: AssemblyAI integration for speech transcription and analysis
- 🎤 **VAPI Interviews**: AI-powered mock interviews for advanced training
- 📊 **Progress Tracking**: Comprehensive analytics and performance metrics

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd speech-game
npm install
```

### 2. Set up Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string from your project dashboard
4. Update `.env.local` with your Neon database URL:

```env
NEON_DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```

### 3. Run Database Migration

Execute the database migration to set up all tables:

```bash
node database/schema/migrate.js
```

This will create all necessary tables:
- `users` - User accounts with access keys
- `user_progress` - Level completion tracking
- `user_sessions` - Session time and activity tracking
- `user_stats` - **Auto-updating** aggregated user statistics and performance metrics (via database triggers)

### Automatic Statistics Updates

The `user_stats` table is automatically maintained through PostgreSQL triggers:
- **Real-time Updates**: Statistics update immediately when users complete levels
- **Calculated Metrics**: Averages, totals, and performance indicators are computed automatically
- **Performance Optimized**: Analytics queries use pre-calculated cached data instead of expensive real-time calculations
- **Fallback Calculations**: If cached stats are unavailable, real-time calculations from progress data ensure accuracy

### 4. Configure Environment Variables

Update your `.env.local` file with all required API keys:

```env
# Neon Database Connection String
NEON_DATABASE_URL=your_neon_database_url_here

# AssemblyAI API Key for speech analysis
ASSEMBLYAI_API_KEY=your_assemblyai_api_key

# VAPI API Key for interview functionality
NEXT_PUBLIC_VAPI_API_KEY=your_vapi_api_key
```

### 5. Add Access Keys (Optional)

If you want to pre-populate the database with authorized users, you can add access keys:

```bash
# Interactive mode - add access keys one by one
npm run db:add-key

# List existing access keys
npm run db:list-keys
```
TEST-ACCESS-KEY => test-key
The script will prompt you to enter access keys for authorized users. Each access key represents one user account in the system.

### 6. Start the Development Server

```bash
npm run dev
```

## Database Schema

### Users Table
- `id` - Primary key
- `access_key` - Unique access key for authentication
- `created_at` - Account creation timestamp
- `last_active` - Last activity timestamp
- `is_active` - Account status

### User Progress Table
- `user_id` - Foreign key to users
- `level_id` - Level number completed
- `success` - Whether level was passed
- `score` - Numerical score (0-100)
- `transcription` - Speech transcription text
- `accuracy` - Speech accuracy percentage
- `fluency` - Speech fluency score
- `words_per_minute` - Speaking speed
- `coins_earned` - Coins awarded
- `xp_earned` - XP awarded

### User Sessions Table
- `user_id` - Foreign key to users
- `session_start` - Session start time
- `session_end` - Session end time (nullable)
- `total_time_seconds` - Session duration
- `levels_attempted` - Levels attempted in session
- `levels_completed` - Levels completed in session
- `total_coins_earned` - Coins earned in session
- `total_xp_earned` - XP earned in session

### User Stats Table
- `user_id` - Foreign key to users (unique)
- `total_coins` - Total coins accumulated
- `total_xp` - Total XP earned
- `current_level` - Current user level
- `current_streak` - Current completion streak
- `best_streak` - Best completion streak
- `total_sessions` - Total sessions played
- `average_score` - Average level score
- `average_accuracy` - Average speech accuracy
- `average_fluency` - Average speech fluency

## API Endpoints

### Authentication
- `POST /api/auth/validate` - Validate access key and create session

### User Data
- `GET /api/user/data` - Get user statistics and progress

### Progress
- `POST /api/progress` - Save level completion
- `GET /api/progress` - Get progress data

### Sessions
- `POST /api/session` - Start/end user sessions (with unique session keys)

### Analytics
- `GET /api/analytics` - Comprehensive user analytics and performance data with pagination
  - Query parameters: `recentActivityLimit`, `sessionLimit`, `includeTrends`

## User Authentication

The application uses access key-based authentication:

1. Users enter their access key on the login screen
2. The key is validated against the database
3. Valid keys create or retrieve user accounts
4. All subsequent requests include the access key in headers/cookies

Access keys are bound to users in external applications and provide the only authorization mechanism.

## Session-Based Tracking

The application implements comprehensive session-based tracking:

### Session Lifecycle
1. **Session Creation**: When a user presses "Start Challenge", a unique session key is generated
2. **Activity Mapping**: All speech analysis, progress saves, and user interactions are linked to the active session
3. **Session Completion**: Sessions are automatically ended when users complete challenges

### Session Data Structure
- **Unique Session Keys**: Each session has a unique identifier (`session_[timestamp]_[random]`)
- **Activity Linking**: All progress records include the session key for grouping
- **Session Statistics**: Track time spent, levels attempted, coins earned, etc.

### Database Relationships
```
user_sessions (session_key) → user_progress (session_key)
```

### Benefits
- **Detailed Analytics**: Track user behavior patterns within sessions
- **Performance Insights**: Analyze session effectiveness and improvement trends
- **Activity Grouping**: Group related activities for better data analysis
- **Session Recovery**: Maintain context across page refreshes and navigation

### Managing Access Keys

You can manage access keys using the provided scripts:

```bash
# Add new access keys interactively
npm run db:add-key

# View existing access keys
npm run db:list-keys
```

**Features:**
- ✅ Checks for duplicate access keys
- 🔄 Can reactivate deactivated users
- 📊 Shows database statistics
- 🎯 Batch entry support

**Example Usage:**
```bash
$ node database/add-access-key.js
🔄 Connecting to Neon DB...
✅ Connected to database
📊 Database Status:
   Total Users: 0
   Active Users: 0

🔑 Access Key Management Tool
=============================
Enter the access key to add (or "quit" to exit): abc123def456
✅ Access key added successfully!
   User ID: 1
   Created: 2024-01-15T10:30:00.000Z
   Access Key: abc123def456

Add another access key? (Y/n): n
👋 Goodbye!
```

## Analytics Dashboard

Users can access detailed analytics by clicking the **📊 ANALYTICS** button in the main game interface. The analytics dashboard provides:

- **Real-time Performance Metrics**: Average scores, accuracy, fluency, and speaking speed
- **Progress Tracking**: Total levels completed, coins earned, and XP accumulated
- **Session Analysis**: Detailed breakdown of performance by session
- **Recent Activity**: Last 10 speech attempts with full transcription and metrics
- **Historical Trends**: Performance improvement over time

### Analytics Data Structure

The `/api/analytics` endpoint provides comprehensive speech performance analytics using cached statistics from the `user_stats` table:

### Overview Metrics
- Total levels completed and current level
- Total coins and XP earned
- Current and best streaks
- Total sessions and time spent

### Performance Metrics
- Average score, accuracy, fluency, and words per minute
- Historical trends and improvement tracking
- Level-by-level breakdown with detailed statistics

### Session Analytics
- Session-by-session performance breakdown (configurable limit)
- Activity grouping by session keys
- Session effectiveness analysis
- Time-based session patterns

### Recent Activity
- Configurable number of recent level attempts with full analysis data
- Transcription text, accuracy scores, fluency ratings
- Duration and performance metrics
- Session context for each activity

### Trends & Insights (Optional)
- Daily progress tracking for the last 30 days
- Performance improvement over time (first half vs second half comparison)
- Session-based analytics for detailed insights
- Comprehensive speech therapy progress monitoring
- Score, accuracy, and fluency improvement metrics

## Development

### Database Management

Available database scripts:
```bash
# Run initial migration (creates all tables)
npm run db:migrate

# Run session key migration (adds session tracking to existing databases)
npm run db:migrate-sessions

# Add access keys for users
npm run db:add-key

# View existing access keys
npm run db:list-keys

# Get analytics for a user (replace YOUR_ACCESS_KEY)
npm run db:analytics
```

To reset the database completely:
```bash
# Drop all tables and rerun migration
node database/schema/migrate.js
```

### Testing

The application includes comprehensive error handling and fallbacks for database connectivity issues.

### Deployment

Ensure all environment variables are set in your deployment environment:
- `NEON_DATABASE_URL`
- `ASSEMBLYAI_API_KEY`
- `NEXT_PUBLIC_VAPI_API_KEY`

## Security Notes

- Access keys are stored securely in HTTP-only cookies
- All database queries use parameterized statements
- User data is isolated by access key validation
- No sensitive information is exposed in client-side code

## Troubleshooting

### Database Connection Issues
- Verify `NEON_DATABASE_URL` is correctly set
- Ensure your Neon project is active
- Check database firewall settings

### Authentication Issues
- Access keys must be validated before use
- Check browser console for authentication errors
- Verify cookie settings for cross-origin requests

### Migration Issues
- Ensure PostgreSQL extensions are available
- Check database permissions
- Verify connection string format

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test database operations
5. Submit a pull request

## License

[Your License Here]
