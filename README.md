# 🤖 Chekidechi (Telegram & Bale) Bot - list telegram Channel for Q&A with AI

## 🌟 Features

### 1. Telegram Channel Integration | ادغام کانال‌های تلگرام

- Summarize Telegram channel content
- Ask questions about channel content
- Quick access to important information
- Seamless integration with Bale

### 2. YouTube Assistant | دستیار یوتیوب

- Video content summarization
- Q&A about video content
- Content generation from videos
- Subtitle download
- Free tokens for usage

### 3. Text Summarizer | خلاصه ساز جمعبندی

- Summarize multiple messages
- Forward message analysis
- Q&A about message content
- Easy-to-use interface

### 4. Play Games & Earn Tokens | بازی کن و توکن بگیر

- Memory game
- Lucky wheel
- Basketball game
- Token rewards

### 5. Additional Features | قابلیت‌های اضافی

- Meme creation and sharing
- Ghibli theme for mini-app
- Comprehensive info section

### Prerequisites | پیش‌نیازها

- Node.js (v20 or higher)
- npm or yarn
- Telegram Bot Token
- Bale Bot Token

### Installation | نصب

1. Clone the repository:

```bash
git clone https://github.com/alirezasoltanian/chekidechi.git
cd chekidechi
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

## 🔧 Environment Variables

Create a `.env` file in the root directory and copy the following variables from `.env.example`. Choose your preferred platform (Bale or Telegram) and configure accordingly:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database
# Connection string for PostgreSQL database

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
# Your OpenAI API key for AI features

# Game Configuration
NEXT_PUBLIC_GAME_SALT=your-game-salt
# Salt for game token generation and verification

# Admin Configuration
ADMIN_CHAT_IDS=your-admin-chat-ids
# Comma-separated list of admin chat IDs

# Model Configuration
DEFAULT_MODEL=your-default-model
# Default AI model to use for responses

# API Keys
SUPADATA_API_KEY=your-supadata-api-key
# API key for Supadata service

# Bot Platform Selection
IS_TELEGRAM_BOT=boolean
# Set to true for Telegram bot, false for Bale bot

# Telegram Configuration (Required if IS_TELEGRAM_BOT=true)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
# Your Telegram bot token from @BotFather
TELEGRAM_API_ROOT=https://api.telegram.org
# Telegram API endpoint

# Bale Configuration (Required if IS_TELEGRAM_BOT=false)
BALE_BOT_TOKEN=your-bale-bot-token
# Your Bale bot token
BALE_API_ROOT=https://tapi.bale.ai
# Bale API endpoint

# YouTube Configuration
YOUTUBE_API_KEY=your-youtube-api-key
# YouTube API key for video features
YOUTUBE_API_SERVER=your-youtube-api-server
# YouTube API server endpoint
YTDL_AUTOUPDATE=true
# Enable automatic ytdl-core updates
```

### Platform Selection Guide

1. **For Telegram Bot:**

   - Set `IS_TELEGRAM_BOT=true`
   - Configure `TELEGRAM_BOT_TOKEN` with your bot token from @BotFather
   - You can leave Bale configuration empty

2. **For Bale Bot:**
   - Set `IS_TELEGRAM_BOT=false`
   - Configure `BALE_BOT_TOKEN` with your Bale bot token
   - You can leave Telegram configuration empty

### Important Notes

- Choose only one platform (Telegram or Bale) to configure
- Replace all placeholder values with your actual credentials
- Keep your API keys and tokens secure
- Never commit your `.env` file to version control
- Make sure to set the correct `IS_TELEGRAM_BOT` value based on your chosen platform

4. Start the bot:

```bash
npm start
# or
yarn start
```

## 📝 Configuration

The bot can be configured through the following environment variables:

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `BALE_BOT_TOKEN`: Your Bale bot token
- `PORT`: Server port (default: 3003)
- `NODE_ENV`: Environment (development/production)

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request.

---
