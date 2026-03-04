<div align="center">

# ⟨USG⟩ United States of Git

### 🌐 A Tron-Themed 3D Visualization of the World's Most Impactful Open-Source Repositories

[![License: MIT](https://img.shields.io/badge/License-MIT-00f0ff.svg?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-000?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-000?style=for-the-badge&logo=three.js)](https://threejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

<br />

<img src="https://img.shields.io/badge/TRON_CITY_THEME-030814?style=for-the-badge&labelColor=030814&color=00f0ff" />

**Watch towers rise from a glowing digital globe — the taller the tower, the greater the impact.**

Each tower represents a GitHub repository. Height = stars + contributors. Color = primary language. Pulse = recent activity.

---

</div>

<br />
<img width="1919" height="940" alt="image" src="https://github.com/user-attachments/assets/ca35556f-2d8b-4049-b776-8a298e2d7fe1" />


<br />

## ✨ Features

| Feature | Description |
|---|---|
| 🌍 **3D Globe** | Interactive Tron-themed globe with lat/lng-positioned repo towers |
| 🏗️ **Tower System** | Height = stars + contributors, Width = contributor count, Color = language |
| 💫 **Live Pulse** | Repos with recent commits emit neon pulse waves |
| 🎨 **Language Districts** | 20+ language colors — cyan for TypeScript, magenta for Python, orange for Rust |
| 🏆 **Leaderboard HUD** | Floating scoreboard ranking repos by combined impact score |
| 🔍 **Search & Filter** | Filter by language, stars, contributors, activity level. `Ctrl+K` quick search |
| 📊 **Repo Comparison** | Select two towers to compare side-by-side |
| 📹 **Fly-To Camera** | Cinematic camera flight when selecting a tower |
| 🌡️ **Activity Heatmap** | Ground glow intensity based on contributor density |
| 🖥️ **Tron Theme** | Full Tron Legacy aesthetic — neon glows, scanlines, glass panels, HUD corners |
| 🔊 **Boot Sequence** | Cinematic loading screen with terminal-style boot animation |
| ⚡ **Post-Processing** | Bloom, chromatic aberration, and particle effects |

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 15** (App Router, TypeScript) |
| 3D Engine | **React Three Fiber + Three.js** |
| Post-Processing | **@react-three/postprocessing** |
| 3D Helpers | **@react-three/drei** |
| Styling | **Tailwind CSS v4** + Custom Tron Theme |
| Animation | **Framer Motion** |
| State Management | **Zustand** |
| Data Source | **GitHub REST API** |
| Icons | **Lucide React** |
| Deployment | **Vercel** |

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/united-states-of-git.git
cd united-states-of-git

# Install dependencies
npm install

# (Optional) Add GitHub token for higher API rate limits
cp .env.example .env.local
# Edit .env.local and add your token

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the Tron boot sequence will play, then the globe appears.

## 🔑 GitHub Token (Optional)

Without a token, the app uses built-in mock data featuring 18 iconic repos (Linux, React, TensorFlow, etc.).

To fetch live data from GitHub:

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Create a token (no special scopes needed — public data only)
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GITHUB_TOKEN=ghp_your_token_here
   ```
4. In `src/app/home-page.tsx`, uncomment the live API import

## 🎮 Controls

| Action | Control |
|---|---|
| Rotate globe | Click + drag |
| Zoom | Scroll wheel |
| Select tower | Click on tower |
| Quick search | `Ctrl+K` / `⌘K` |
| Close panel | `Escape` |
| Toggle auto-rotate | Rotate icon in nav |

## 📁 Project Structure

```
src/
├── app/
│   ├── globals.css          # Tron theme, animations, utilities
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Entry point
│   └── home-page.tsx        # Main client component
├── components/
│   ├── 3d/
│   │   ├── GlobeScene.tsx   # Canvas, camera, lights, post-processing
│   │   ├── TronGlobe.tsx    # Wireframe globe with glow shaders
│   │   └── RepoTower.tsx    # Individual tower with hover/select
│   └── ui/
│       ├── TopNav.tsx       # Navigation bar with controls
│       ├── BottomHUD.tsx    # Stats bar (stars, forks, languages)
│       ├── RepoDetailPanel.tsx  # Slide-in repository details
│       ├── LeaderboardPanel.tsx # Ranked repository list
│       ├── SearchBar.tsx    # Command palette search
│       ├── FilterPanel.tsx  # Language/activity/star filters
│       ├── AboutModal.tsx   # Project information
│       └── LoadingScreen.tsx # Tron boot sequence
└── lib/
    ├── types.ts             # TypeScript interfaces & language colors
    ├── github.ts            # GitHub API integration
    ├── mock-data.ts         # 18 pre-loaded repositories
    ├── store.ts             # Zustand state management
    └── three-utils.ts       # 3D math utilities
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Fork → Branch → Code → PR
git checkout -b feature/amazing-feature
git commit -m 'Add amazing feature'
git push origin feature/amazing-feature
```

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Created by [Prabhat Teotia](https://github.com/prabhatteotia)**

*"The Grid. A digital frontier."*

</div>
