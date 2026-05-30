@AGENTS.md

# Project: SIDEQUEST (Real-Life RPG Social App)

## 🎯 Project Overview

An interactive, mobile-first social web app where friends form lobbies, complete real-life "sidequests", track live locations, verify via photo-proof with a veto system, play daily trivia, and earn XP to use in the shop.

## 🛠 Tech Stack

- Frontend/Backend: Next.js (App Router)
- Database: Neon DB (Serverless Postgres) + Prisma ORM
- Auth: NextAuth.js (Email Magic Links)
- Notifications: Resend (Email Alerts)
- Map: Leaflet.js / Mapbox
- UI Theme: Dark Cyberpunk/Neon (Glassmorphism, Neon glows), but clean and structured.

## 🧠 Database Entities

- User, VerificationToken, Lobby, CharacterClass, Quest, Submission, MapLocation, ShopItem, Trivia.

## ⚡ TOKEN SAVING & EFFICIENCY RULES (CRITICAL)

To save context window and tokens, Claude MUST follow these rules:

1. **No Explanations:** Do NOT explain how the code works, what libraries do, or how to install npm packages unless explicitly asked. Just output the clean code.
2. **No Redundant Code:** When updating an existing file, ONLY output the specific lines/blocks that changed. Use comments like `// ... existing code ...` to omit unchanged parts. Never rewrite the whole file.
3. **No Fluff:** Skip greetings, pleasantries, and summaries. Start directly with the file path or code snippet.
4. **Dry Run First:** If a feature is too complex, ask for user confirmation on the logic _before_ writing any code.
