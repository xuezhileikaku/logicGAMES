# Super Logic Board AI 🧠

**Super Logic Board AI** is a multi-functional digital board game console powered by **Google Gemini AI**. It combines classic logic games with modern AI capabilities, offering intelligent opponents, real-time coaching, and a retro-futuristic interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![Gemini AI](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)

## ✨ Features

- **🤖 AI-Powered Opponents**: Play Gomoku and Go (Weiqi) against an AI powered by Google's `gemini-2.5-flash` model.
- **💡 AI Coaching & Hints**: Get real-time, context-aware strategic advice and specific move suggestions from the AI Coach.
- **🌍 Bilingual Support**: Full support for English and Chinese (中文), toggleable instantly.
- **🎨 Creative Tools**: A pixel art "Free Draw" mode with Save/Load functionality using LocalStorage.
- **🔊 Synthesized Audio**: Custom sound effects generated via Web Audio API (no external assets required).
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices.

## 🎮 Game Modes

### 1. Gomoku (Five-in-a-Row) ⚫⚪
- **Modes**: Vs AI, Local PvP, Online PvP (Simulated).
- **Features**: 
  - Undo/Redo functionality (last 5 moves).
  - 30-second turn timer.
  - "Hint" button to ask AI for the best move.
  - 3 Difficulty levels (Easy, Medium, Hard).

### 2. Go (Weiqi) ⛩️
- **Rules**: Simplified Chinese rules (Territory + Captures).
- **Features**: 
  - Automatic liberty calculation and stone capturing.
  - Suicide move prevention.
  - Scoring system based on stones on board + captures.
  - Pass logic (game ends on consecutive passes).

### 3. Memory Match 🃏
- Classic card flipping game to test cognitive recall.
- Emoji-based assets.
- Turn counter and visual victory effects.

### 4. Snake 🐍
- Classic arcade gameplay.
- **High Score System**: Saves your best record locally.
- D-Pad controls for mobile users.

### 5. Free Draw 🎨
- 15x15 Pixel Art Grid.
- 8-color palette.
- **Save/Load**: Save your masterpieces to the browser's local storage.

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript
*   **AI Integration**: `@google/genai` SDK
*   **Styling**: Tailwind CSS
*   **Build/Runtime**: ES Modules (esm.sh) - No heavy bundler required for this setup.
*   **Audio**: Native Web Audio API

## 🚀 Getting Started

### Prerequisites

You need a Google Gemini API Key to enable the AI features (Opponent & Coach).
Get one here: [Google AI Studio](https://aistudio.google.com/)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/super-logic-board-ai.git
    cd super-logic-board-ai
    ```

2.  **Environment Setup**:
    The application expects the API Key to be available in `process.env.API_KEY`. 
    *Note: Since this is a client-side prototype, ensure you handle your API key securely in a production environment.*

3.  **Run the App**:
    Since this project uses ES Modules directly via `index.html`, you can serve it using any static file server.

    Using Python:
    ```bash
    python3 -m http.server 8000
    ```
    
    Using Node (http-server):
    ```bash
    npx http-server .
    ```

4.  **Open in Browser**:
    Visit `http://localhost:8000`

## 📂 Project Structure

```
/
├── index.html              # Entry point
├── index.tsx               # React root
├── App.tsx                 # Main application layout
├── types.ts                # TypeScript definitions
├── metadata.json           # App metadata
├── components/             # Reusable UI components
│   ├── GameCard.tsx        # Menu selection cards
│   └── TutorialModal.tsx   # Game rules modal
├── games/                  # Game Logic & Components
│   ├── Gomoku.tsx          # Five-in-a-row
│   ├── Go.tsx              # Go/Weiqi
│   ├── Snake.tsx           # Snake game
│   ├── Memory.tsx          # Memory Match
│   └── FreeDraw.tsx        # Drawing tool
├── services/
│   └── geminiService.ts    # Google GenAI API integration
└── utils/
    ├── sound.ts            # Web Audio API synth
    ├── translations.ts     # i18n strings
    └── goLogic.ts          # Go rules (liberties, capture)
```

## 🔮 Future Plans

- [ ] **Tetris Mode**: Currently a placeholder.
- [ ] **Real Online Multiplayer**: Replace simulated matchmaking with WebSockets/WebRTC.
- [ ] **SGF Export**: Save Go/Gomoku games to standard file formats.
- [ ] **AI Persona Customization**: Choose different AI personalities for coaching.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open-source and available under the MIT License.
