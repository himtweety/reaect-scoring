# Offline Scoreboard App

A simple, offline-capable scoreboard application built with **React**, **Vite**, and **Bootstrap UI** (via shadcn/ui). The app allows users to input players, track scores across rounds, and handle custom scoring logic with a round winner.

## 🧩 Features

- ⚡ Offline-ready and lightweight
- 👥 Custom player setup
- 📝 Round-wise input for:
  - Value (custom factor-based)
  - Points (with winner exception)
  - Winner selection
- 🧠 Automatic score calculations based on value factors
- 🏆 Total score column
- 🧮 Enforces max 10 points per player (except winner)
- ♻️ Reset game or start a new game
- 💾 Persists data with `localStorage`

## 🔧 Tech Stack

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/)
- [shadcn/ui](https://ui.shadcn.com/) (UI components)
- [Tailwind CSS](https://tailwindcss.com/)
- [Bootstrap Theme Layer] (Optional for styling, if used)

## 🚀 Getting Started

### Prerequisites

Make sure you have:

- Node.js (v18 or later)
- npm / yarn / pnpm

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev


---

### 5. **Scoring Logic**

```markdown
## 🧮 Scoring Logic

- Each player enters a `value` and `point`.
- A **winner** is selected per round (winner's point is automatically set to 0).
- The score is calculated using:

  ```ts
  valueFactor = (value * value + 3 * value) / 2
  totalValueFactor = sum of all valueFactors

  score = (valueFactor * (numPlayers - 1) - points[i]) - totalValueFactor
  winnerScore = -sum(all other player scores)

---

### 6. **Data Persistence**

```markdown
## 💾 Data Persistence

- **Players** and **rounds** are stored in `localStorage`.
- You can:
  - **Reset Game**: Clears all rounds, retains players
  - **Start New Game**: Clears players and rounds, returns to home screen
## 📁 Folder Structure

## 🛠 TODO / Enhancements (Optional)

- Export/import game data (as JSON)
- Add animations for score transitions
- Allow renaming players mid-game
- Add dark mode toggle
## 🙋‍♂️ Author

Made with ❤️ by a self-learning developer from Uttar Pradesh.
