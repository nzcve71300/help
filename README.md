# 🌱 Seedy Discord Bot

A comprehensive Discord bot with economy system, mini-games, moderation, surveys, and AI features.

## Features

### 🎮 Mini Games
- **Hangman**: Word guessing game with rewards
- **Economy System**: Earn seeds through games and daily rewards
- **Leaderboards**: Track top players

### 🛡️ Moderation
- **Automatic Profanity Detection**: Filters inappropriate language
- **Warning System**: Issues warnings with custom image
- **Message Deletion**: Removes inappropriate messages automatically
- **Role-Based Permissions**: SeedyAdmin role for admin commands

### 📋 Survey System
- **Interactive Surveys**: Create surveys with 4 questions
- **Modal Responses**: Users fill out forms to submit answers
- **Channel Logging**: All responses sent to designated channel

### 🌱 ZORP Monitoring
- **Keyword Detection**: Monitors for ZORP-related messages
- **Auto-Response**: Provides helpful information and channel redirects
- **Support Integration**: Directs users to support channels

### 💰 Economy Features
- **Daily Rewards**: Claim daily seeds with streak bonuses
- **Game Rewards**: Earn seeds by playing games
- **Transaction History**: Track all earnings and spending
- **Balance System**: Check your seed balance anytime

### 🔐 Permission System
- **SeedyAdmin Role**: Automatically created when bot joins server
- **Economy Commands**: Available to everyone
- **Admin Commands**: Restricted to SeedyAdmin role members

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   - Copy `config.example.env` to `.env`
   - Fill in your Discord bot token and other settings

3. **Required Environment Variables**
   ```
   DISCORD_TOKEN=your_discord_bot_token
   CLIENT_ID=your_discord_client_id
   GUILD_ID=your_discord_server_id
   ```

4. **Deploy Commands**
   ```bash
   npm run deploy
   ```

5. **Start the Bot**
   ```bash
   npm start
   ```

## Commands

### Economy Commands (Everyone can use)
- `/balance` - Check your seed balance
- `/daily` - Claim daily reward
- `/leaderboard` - View top players
- `/hangman` - Start/play Hangman game
- `/hangman <letter>` - Guess a letter in Hangman

### Admin Commands (SeedyAdmin role required)
- `/survey <q1> <q2> <q3> <q4>` - Create a survey
- `/setup-survey <channel>` - Set survey response channel
- `/warnings <user>` - Check user warnings
- `/clear-warnings <user>` - Clear user warnings

## Configuration

### Server Restriction
The bot is restricted to only work on server ID: `1412842631561613375`
- If someone tries to add the bot to another server, it will automatically leave
- All commands and features only work on the authorized server

### Channel IDs
The bot uses these hardcoded channel IDs:
- **ZORP Channel**: `1387306698192064554`
- **Support Channel**: `1360485036973097224`

### Images
- **Warning Image**: `https://i.imgur.com/xxdt9Ww.png` (attached to moderation warnings)
- **ZORP Image**: `https://i.imgur.com/O8xh49D.png` (attached to ZORP information responses)

## Database

The bot uses SQLite database with the following tables:
- `users` - User economy data
- `transactions` - Transaction history
- `survey_config` - Survey channel configuration
- `survey_responses` - Survey response data
- `game_stats` - Game statistics
- `warnings` - Moderation warnings

## Features in Detail

### Economy System
- New users start with 1000 seeds
- Daily rewards: 100 base + streak bonus (max 200)
- Game rewards: 50 seeds per win
- Transaction logging for all activities

### Moderation System
- Automatic detection of inappropriate language
- Deletes inappropriate messages
- Sends warning embeds with custom image
- Logs warnings to database
- Sends DM notifications to users

### Survey System
- Interactive button-based surveys
- Modal forms for responses
- Automatic logging to designated channel
- Admin-only setup commands

### ZORP Monitoring
- Monitors all messages for ZORP keywords
- Provides helpful information and channel redirects
- Integrates with support system

## Development

### Project Structure
```
src/
├── commands/          # Slash commands
├── services/          # Core bot services
│   ├── AIService.js
│   ├── DatabaseService.js
│   ├── EconomyService.js
│   ├── ModerationService.js
│   └── SurveyManager.js
└── index.js          # Main bot file
```

### Adding New Features
1. Create new service in `src/services/`
2. Add commands in `src/commands/`
3. Update database schema if needed
4. Test thoroughly before deployment

## Support

For support or questions about ZORP, the bot will automatically detect mentions and provide helpful information with channel redirects.

## License

MIT License - feel free to modify and use for your own projects!
