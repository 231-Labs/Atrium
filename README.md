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
├── contract/                          # Sui Move contracts
│   └── sources/
│       ├── identity.move              # User identity NFTs (Sui)
│       ├── space.move                 # Gallery spaces (Sui Kiosk)
│       └── subscription.move          # Subscription system (Sui)
│
├── frontend/
│   ├── app/api/ai-weather/            # AI Weather API endpoint
│   │   └── route.ts
│   │
│   ├── services/                      # Core services
│   │   ├── aiWeatherClient.ts         # AI Weather client
│   │   ├── chainDataApi.ts            # CoinGecko market data
│   │   ├── poeApi.ts                  # POE AI integration
│   │   ├── timeFactors.ts             # Market time analysis
│   │   ├── walrusApi.ts               # Walrus storage service
│   │   └── sealContent.ts             # Seal encryption service
│   │
│   ├── config/
│   │   ├── sui.ts                     # Sui network config
│   │   ├── walrus.ts                  # Walrus endpoints
│   │   ├── seal.ts                    # Seal key servers
│   │   └── aiPrompts.ts               # AI weather prompts
│   │
│   ├── hooks/
│   │   └── useAIWeather.ts            # AI Weather state hook
│   │
│   ├── components/3d/
│   │   └── AIWeatherIndicator.tsx     # Weather UI component
│   │
│   └── utils/
│       ├── kioskTransactions.ts       # Sui Kiosk transactions
│       └── transactions.ts            # Sui transaction helpers
│
└── docs/
    └── AI_WEATHER_SYSTEM.md           # AI Weather system docs
```

---

## 🎮 User Flows

```mermaid
flowchart TD
    Start([開始]) --> UserType{用戶類型}
    
    UserType -->|創作者| CreatorFlow
    UserType -->|粉絲| FanFlow
    
    %% Creator Flow
    CreatorFlow[創作者流程] --> ConnectWallet1[連接 Sui 錢包]
    ConnectWallet1 --> UploadProfile1[上傳頭像到 Walrus]
    UploadProfile1 --> MintIdentity1[鑄造 Identity NFT<br/>Sui 鏈上]
    MintIdentity1 --> InitSpace[初始化 Gallery Space<br/>支付 0.1 SUI]
    InitSpace --> UploadCover[上傳封面圖到 Walrus]
    UploadCover --> SetPrice[設定訂閱價格]
    SetPrice --> UploadContent[上傳內容]
    UploadContent --> EncryptSeal[使用 Seal 加密]
    EncryptSeal --> StoreWalrus[儲存到 Walrus]
    StoreWalrus --> PlaceNFT[放置 NFT 到 Gallery<br/>Sui Kiosk]
    PlaceNFT --> ManageSubs[管理訂閱者]
    ManageSubs --> End1([完成])
    
    %% Fan Flow
    FanFlow[粉絲流程] --> ConnectWallet2[連接 Sui 錢包]
    ConnectWallet2 --> UploadProfile2[上傳頭像到 Walrus]
    UploadProfile2 --> MintIdentity2[鑄造 Identity NFT<br/>Sui 鏈上]
    MintIdentity2 --> BrowseSpaces[瀏覽 Gallery Spaces]
    BrowseSpaces --> ViewWeather[體驗 AI 天氣效果<br/>CoinGecko + POE]
    ViewWeather --> PreviewContent[預覽公開內容]
    PreviewContent --> Subscribe{訂閱?}
    Subscribe -->|是| PaySUI[支付 SUI 訂閱費<br/>鏈上交易]
    PaySUI --> DecryptSeal[解鎖 Seal 加密內容]
    DecryptSeal --> AvatarAppears[頭像出現在 Gallery]
    AvatarAppears --> End2([完成])
    Subscribe -->|否| End2
    
    style CreatorFlow fill:#e1f5ff
    style FanFlow fill:#fff4e1
    style EncryptSeal fill:#ffe1f5
    style DecryptSeal fill:#ffe1f5
    style StoreWalrus fill:#e1ffe1
    style UploadProfile1 fill:#e1ffe1
    style UploadProfile2 fill:#e1ffe1
    style MintIdentity1 fill:#f0e1ff
    style MintIdentity2 fill:#f0e1ff
    style PaySUI fill:#f0e1ff
    style ViewWeather fill:#ffe1e1
```


