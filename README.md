# Atrium 🏛️

> **Web3 creator platform with AI-powered dynamic 3D spaces**

Atrium is a decentralized creator platform where artists showcase their work in immersive 3D galleries. What makes it unique: an **AI Weather System** that transforms gallery atmospheres in real-time based on crypto market data.

---

## 🌟 Key Features

- 🌤️ **AI Weather System** - Gallery ambiance adapts to crypto market conditions (BTC, ETH, SUI, WAL)
- 🎨 **NFT Integration** - Built on Sui Kiosk standard for seamless NFT display
- 🔐 **Encrypted Content** - Seal encryption for subscriber-only videos and media
- 💎 **Subscription Economy** - Direct creator payments with on-chain verification
- ⚡ **Decentralized Storage** - Walrus for permanent, censorship-resistant content

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Blockchain** | Sui | Identity, spaces, subscriptions |
| **Storage** | Walrus | Decentralized storage for media |
| **Encryption** | Seal | Content protection |
| **3D Rendering** | Three.js | WebGL-based 3D scenes |
| **Frontend** | Next.js 14 | React framework |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **DATA x AI** | CoinGecko + POE | Market-driven weather |

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 18+
Sui Wallet (browser extension)
```

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/atrium.git
cd atrium/frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=0x...
POE_API_KEY=your_poe_api_key
```
---

## 📁 Project Structure

```
atrium/
├── contract/                   # Sui Move contracts
│   ├── sources/
│   │   ├── identity.move      # User identity NFTs
│   │   ├── space.move         # Gallery spaces (Kiosk-based)
│   │   └── subscription.move  # Subscription system
│   └── Move.toml
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── space/[id]/        # Gallery detail view
│   │   └── api/ai-weather/    # Weather API endpoint
│   │
│   ├── components/
│   │   ├── 3d/                # Three.js components
│   │   │   ├── ThreeScene.tsx
│   │   │   ├── AIWeatherIndicator.tsx
│   │   │   └── GLBViewer.tsx
│   │   ├── space/             # Gallery components
│   │   │   ├── display/       # Space list, cards, detail
│   │   │   ├── content/       # Content upload, manager
│   │   │   └── creation/      # Space creation flow
│   │   └── common/            # Retro UI components
│   │
│   ├── lib/three/
│   │   ├── SceneManager.ts    # Core 3D scene management
│   │   ├── effects/           # Weather & water effects
│   │   └── TransformControls.ts
│   │
│   ├── services/
│   │   ├── aiWeatherClient.ts # Weather API client
│   │   ├── chainDataApi.ts    # CoinGecko integration
│   │   ├── walrusApi.ts       # Walrus storage
│   │   ├── sealVideo.ts       # Seal encryption
│   │   └── timeFactors.ts     # Market time analysis
│   │
│   └── hooks/
│       ├── useAIWeather.ts    # Weather state management
│       ├── useSpace.ts        # Space data fetching
│       └── useIdentity.ts     # User identity
│
└── docs/
    ├── AI_WEATHER_SYSTEM.md   # Weather system guide
    └── PROJECT_SUMMARY.md     # Detailed project info
```

---

## 🎮 User Flows

### For Creators

1. **Create Identity**
   - Connect Sui wallet
   - Upload profile image to Walrus
   - Mint Identity NFT

2. **Initialize Gallery Space**
   - Pay 0.1 SUI initialization fee
   - Upload cover image
   - Configure 3D scene
   - Set subscription price

3. **Upload Content**
   - Add videos/images
   - Encrypt with Seal
   - Store on Walrus
   - Place NFTs in gallery

4. **Manage Subscribers**
   - View subscriber avatars in space
   - Update gallery layout
   - Release new content

### For Fans

1. **Create Identity**
   - Connect wallet
   - Upload profile image
   - Mint Identity NFT

2. **Explore Galleries**
   - Browse creator spaces
   - Experience dynamic weather
   - Preview public content

3. **Subscribe**
   - Pay subscription fee in SUI
   - Gain access to encrypted content
   - Avatar appears in creator's gallery


