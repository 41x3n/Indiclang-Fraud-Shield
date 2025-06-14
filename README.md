# Indiclang Fraud Shield

Indiclang Fraud Shield is a lightweight, multilingual scam detection assistant for WhatsApp and Telegram. Users can forward suspicious messages or screenshots, and the system responds in their preferred Indian language with a clear verdict—"Scam," "Maybe," or "Safe"—along with reasoning and advice. The platform combines rule-based heuristics with Google's Gemini LLM for nuanced language analysis and localization, supporting major Indian languages including Hindi, Bengali, Gujarati, Kannada, Malayalam, Marathi, Telugu, Tamil, Urdu, and English.

> **Note:** This project was originally built for the **AI in Action hackathon** and was required to be developed and hosted on GitLab. This repository is a clone for sharing and future development on GitHub. All future features and updates will be added here.

**Want to see it in action? Try out the [Telegram Bot](https://t.me/IndicLangBot)!**

## Inspiration

In India, messaging scams are rampant, especially targeting non-English speakers and older adults. Indiclang Fraud Shield was created to empower users to verify suspicious messages in their own language, leveraging AI and rules to provide instant, accessible help.

## Features

- **Multilingual Support:** Detects scams and explains risks in 10+ Indian languages.
- **Hybrid AI Approach:** Combines rule-based heuristics (for patterns like UPI IDs, suspicious links, urgent phrases) with Gemini LLM for deep language understanding.
- **Screenshot Analysis:** Uses Google OCR to extract text from images for scam detection.
- **Personalized Responses:** Translates results and advice into the user's preferred language.
- **Cloud-Native:** Runs on Google Cloud Functions with Firestore for storage.
- **Bots for WhatsApp & Telegram:** Seamless integration with both platforms.
- **CI/CD:** Automated deployments via GitLab CI/CD.
- **Extensible:** Modular codebase for easy addition of new heuristics, languages, or platforms.

## Project Structure

```
.
├── apps/
│   └── functions/
│       ├── fraud-analysis/
│       ├── telegram-callback/
│       └── whatsapp-callback/
├── lib/
│   ├── config.ts
│   ├── error.ts
│   ├── logger.ts
│   └── db/
├── types/
│   ├── errors.ts
│   ├── generic.ts
│   ├── heuristic.ts
│   ├── index.ts
│   └── response.ts
├── .gitlab/
│   └── ci/
├── dev.ts
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── README.md
```

- **apps/functions/**: Cloud function source code for each service (fraud analysis, Telegram, WhatsApp).
- **lib/**: Shared libraries (config, logging, database, LLM, middleware).
- **types/**: Shared TypeScript types and interfaces.
- **.gitlab/ci/**: GitLab CI/CD pipeline definitions.
- **dev.ts**: Local development entry point.

## How It Works

1. **User forwards a message or screenshot** to the bot (WhatsApp/Telegram).
2. **Heuristics engine** checks for obvious scam patterns.
3. **Gemini LLM** analyzes the message for nuanced or context-based scams, using few-shot prompting and heuristics as context.
4. **OCR pipeline** extracts text from images if needed.
5. **Final verdict** is a blend of heuristic and LLM output, translated to the user's language.
6. **Response** includes a verdict, reasoning, and actionable advice.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [pnpm](https://pnpm.io/) (v10+)
- Google Cloud SDK (for deployment)
- Firebase project and credentials

### Installation

```sh
git clone https://github.com/your-org/indiclang-fraud-shield.git
cd indiclang-fraud-shield
pnpm install
```

### Build

```sh
pnpm -r run build
```

### Development

```sh
pnpm dev
```

This runs all functions locally using the Functions Framework.

### Linting & Formatting

```sh
pnpm lint
pnpm format
```

### Deployment

Each function can be deployed individually using the provided GitLab CI pipelines or manually via the Google Cloud CLI. Example for fraud-analysis:

```sh
pnpm --filter fraud-analysis run build
gcloud functions deploy fraudAnalysis \
  --gen2 \
  --entry-point=defaultHandler \
  --runtime=nodejs20 \
  --trigger-http \
  --source=apps/functions/fraud-analysis/dist \
  --allow-unauthenticated
```

See `.gitlab/ci/*.yml` for full deployment scripts.

## Configuration

- Environment variables are used for API keys, tokens, and URLs.
- See `.gitignore` for ignored secrets and config files.

## Roadmap

- Add feedback loop to improve classification over time
- Support more Indian scripts and dialects
- Publish a dashboard for analytics and tuning

## License

ISC

---

**Contributions and issues are welcome!**

If you'd like to contribute, please email me or raise a discussion first before opening a pull request.

---

- [Telegram Bot](https://t.me/IndicLangBot)
- [Devpost Project Page](https://devpost.com/software/indiclang-fraud-shield)
