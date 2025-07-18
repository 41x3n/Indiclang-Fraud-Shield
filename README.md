# 🚨 IndicLang Fraud Shield

A lightweight, multilingual scam detection bot for **Telegram**. Built for India, powered by AI.

Users can forward suspicious texts or screenshots, and get a **verdict** (“Scam,” “Maybe,” or “Safe”) with **reasons and advice** in their own language.

### 🧠 How It Works

- ✅ **Rule-based heuristics** detect UPI IDs, urgent phrases, scam links, and more.
- 🤖 **Gemini LLM** analyzes the tone, language, and subtle cues across Indian languages.
- 🗣️ Final output is translated into the user’s preferred language.

> Built for the *AI in Action Hackathon* (GitLab x Google Cloud). This repo is the GitHub mirror for ongoing development.



### 🔑 Features

- 🗣️ Supports 9+ Indian languages: Hindi, Bengali, Tamil, Telugu, Urdu, Kannada, Malayalam, Marathi, Gujarati, English
- 🧩 Handles **screenshots** using Google OCR
- ☁️ Runs on **Google Cloud Functions** (fully serverless)
- 📦 **Modular codebase** using TypeScript and pnpm
- 🔁 GitLab **CI/CD** pipelines
- 📲 [Try the Telegram Bot](https://t.me/IndicLangBot)


### 📁 Repo Layout

```
apps/functions/        → Cloud Functions: fraud-analysis, telegram, whatsapp
lib/                   → Shared modules (LLM, Firestore, logging)
types/                 → TypeScript types and enums
.gitlab/ci/            → CI/CD pipeline definitions
```



### 🔍 What Happens When You Use It

1. You send a message or screenshot to the bot  
2. It runs **heuristics** to find obvious scam indicators  
3. Then it calls **Gemini LLM** with examples + context  
4. The system blends both scores for a **final verdict**  
5. Response is **localized** with reasoning + suggestion  

---

## 🚀 Getting Started

### 🔧 Requirements

- [Node.js](https://nodejs.org/) v18+
- [pnpm](https://pnpm.io/) v10+
- Google Cloud SDK
- Firebase project + credentials



### 📦 Setup

```bash
git clone https://github.com/your-org/indiclang-fraud-shield.git
cd indiclang-fraud-shield
pnpm install
```

To build the project:

```bash
pnpm -r run build
```

To run locally (all functions):

```bash
pnpm run start
```

Linting and formatting:

```bash
pnpm lint
pnpm format
```



### ☁️ Deployment (Example: fraud-analysis)

```bash
pnpm --filter fraud-analysis run build

gcloud functions deploy fraudAnalysis \
  --gen2 \
  --entry-point=defaultHandler \
  --runtime=nodejs20 \
  --trigger-http \
  --source=apps/functions/fraud-analysis/dist \
  --allow-unauthenticated
  --set-env-vars {ENVS}
```

> Full CI pipeline configs in `.gitlab/ci/*.yml`



### ⚙️ Configuration

- Uses `.env` or Secret Manager for credentials, tokens, etc.
- See `.gitignore` for excluded sensitive files

---

## 📄 License

[ISC](https://opensource.org/licenses/ISC)



## 🤝 Contributing

🔧 Devs Welcome: Fork, clone, or raise issues. Contributions and feedback are appreciated!



- 🧪 [Try the Telegram Bot](https://t.me/IndicLangBot)  
