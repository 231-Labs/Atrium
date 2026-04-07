# Atrium 大重構：3D 瘦身、Sui SDK 升級、訂閱續訂

> **下個 session 起手式**：請從下面的「Progress」段落讀，已完成的不要重做，未完成的從 Part C 開始。
> 工作分支：`claude/refactor-3d-sui-upgrade-vlsx4`。先 `cd /home/user/Atrium/frontend && npm install`（lockfile 已生成），再 `npx tsc --noEmit` 看當前錯誤。

---

## Progress (session 1，2026-04-07)

### ✅ 已完成

**A. 死碼清掃** — 刪除 `frontend/hooks/` 底下 35 個 dead duplicate 檔案。Live 版本都在 `components/.../hooks/`。倖存的 live 檔案只剩 `useResponsive.ts` 和 `utils/useKioskClient.ts`。整體 frontend hooks 目錄從 35+ 檔案瘦身到 2 檔案。

**B. Sui 升級基礎建設**：
- `frontend/package.json`：移除 `@mysten/dapp-kit ^0.19.9`，新增 `@mysten/dapp-kit-react ^2.0.1`，升級 `@mysten/sui` 到 `^2.14.1`、`@mysten/kiosk` 到 `^1.2.0`、`@mysten/seal` 到 `^1.1.1`。`npm install` 通過。
- `frontend/app/providers.tsx`：完全重寫。改用 `createDAppKit` + `DAppKitProvider`。**主 client 是 `SuiGrpcClient`**（`@mysten/sui/grpc`），同時 module-scoped 保留一個 `SuiJsonRpcClient` 作為 `queryEvents` fallback，透過 `getJsonRpcFallbackClient()` 暴露。`Register` interface 透過 module augmentation 綁定具體 dAppKit 型別，所有 hook 都能拿到 typed result。
- `frontend/config/walletTheme.ts`：**已刪除**。
- `frontend/app/dapp-kit-overrides.css`：新建。把舊 `retroWhiteTheme` 的所有顏色、半徑、字型對應到 `--dapp-kit-*` CSS 變數（新版 ConnectButton 是 Lit web component，從 host 讀變數）。
- `frontend/app/layout.tsx`：import 新 CSS。
- `frontend/components/providers/KioskClientProvider.tsx`：`useSuiClient` → `useCurrentClient`；`Network.TESTNET` enum 已從 `@mysten/kiosk` 1.2 移除，改傳字串 `'testnet'`。
- `frontend/app/page.tsx`、`components/layout/Sidebar.tsx`、`components/settings/SettingsPage.tsx`：`ConnectButton` 改 import 自 `@mysten/dapp-kit-react/ui`；`useCurrentAccount` 改 import 自 `@mysten/dapp-kit-react`；新版 `ConnectButton` 不再吃 `connectText` / `style` props（純 CSS 樣式），已移除舊 props。
- `SettingsPage.tsx`：`useSignAndExecuteTransaction` 在新版不存在，加了一個本地 shim hook `useSignAndExecuteTransactionShim`（內部用 `useDAppKit().signAndExecuteTransaction(...)`），讓檔案至少 parse 通過。**Part C 必須移除 shim、改寫呼叫端**。

### ❌ 未完成（Part C 起跳，下一個 session 處理）

`tsc --noEmit` 目前還有 **71 個錯誤**，分佈如下（已存於 `/tmp/atrium-tsc-errors.txt`，但下個 session 重跑 tsc 即可重得）：

| 錯誤碼 | 數量 | 意義 | 處理方式 |
|---|---|---|---|
| TS2307 | 33 | `Cannot find module '@mysten/dapp-kit'` | 全部改 import path 到 `@mysten/dapp-kit-react` |
| TS2305 | 7 | `@mysten/sui/client` 不再 export `SuiClient` / `SuiEvent` / `getFullnodeUrl` | 全面改用 `useCurrentClient()` 拿 client；不要再直接 `new SuiClient`；事件型別改用 fallback jsonRpc client 的型別 |
| TS7006 | 31 | implicit any | 多數是 `.then(result => ...)` 與 `.catch(error => ...)` 的回呼參數，補上型別即可 |

所有錯誤集中在以下檔案（按錯誤數降序）：

```
6  components/space/display/SpacePreviewWindow.tsx
4  components/space/hooks/useSpaceAuthToken.ts
3  components/subscription/SubscribeButton.tsx
3  components/space/settings/UpdateSubscriptionPriceForm.tsx
3  components/space/nft/hooks/useKioskListing.ts
3  components/space/hooks/useUserSpaces.ts
3  components/space/hooks/useSubscribedSpaces.ts
3  components/space/display/SpaceDetail.tsx
3  components/space/creation/CreateSpaceForm.tsx
3  components/space/creation/CreateSpaceButton.tsx
3  components/identity/IdentityRegistration.tsx
2  services/sealContent.ts
2  services/contentIndexer.ts
2  hooks/utils/useKioskClient.ts
2  components/space/nft/hooks/usePurchaseNFT.ts
2  components/space/nft/hooks/useMarketplaceKioskCap.ts
2  components/space/hooks/useSpaces.ts
2  components/space/hooks/useSpaceSubscription.ts
2  components/space/hooks/useSpaceAccess.ts
2  components/space/content/ContentUploadWindow.tsx
2  components/identity/hooks/useWalletSignature.ts
1  components/space/nft/hooks/useKioskManagement.ts
1  components/space/nft/hooks/useKioskListedItems.ts
1  components/space/nft/hooks/useKioskData.ts
1  components/space/nft/MerchCard.tsx
1  components/space/media/VideoPlayer.tsx
1  components/space/hooks/useSpaceSubscribers.ts
1  components/space/hooks/useSpaceData.ts
1  components/space/hooks/useSpaceContents.ts
1  components/space/hooks/useSpace.ts
1  components/space/display/LandingPageView.tsx
1  components/space/content/hooks/useSecureContent.ts
1  components/space/content/hooks/useContentManagement.ts
1  components/identity/hooks/useIdentity.ts
1  components/identity/hooks/useCreatorIdentity.ts
```

### Part C 速查表（下個 session 直接照抄即可）

#### Hook import 對照
```diff
- import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
+ import { useCurrentAccount, useCurrentClient, useDAppKit } from '@mysten/dapp-kit-react';
```

#### `useSignAndExecuteTransaction` 沒有了，改 await pattern
```diff
- const { mutate: signAndExecute } = useSignAndExecuteTransaction();
- signAndExecute(
-   { transaction: tx },
-   {
-     onSuccess: (result) => { /* ... */ },
-     onError: (error) => { /* ... */ },
-   },
- );
+ const dAppKit = useDAppKit();
+ try {
+   const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });
+   /* ... */
+ } catch (error) {
+   /* ... */
+ }
```
回傳結構是 `{ effects, transaction, bcs }`（`TransactionResultWithEffects`），不是 legacy 的 `SuiTransactionBlockResponse`。

#### `getOwnedObjects` → `listOwnedObjects`
新版 client 介面：
```ts
const result = await client.listOwnedObjects({
  address,
  type: `${PACKAGE_ID}::identity::Identity`,
});
// result.objects 是 protobuf 結構，不再有 .data.content.fields
// 要拿欄位：result.objects[i].content（依 include 選項而定）
```
所有用 `getOwnedObjects({ filter: { StructType } })` 的地方都要改成 `listOwnedObjects({ type })`。Response shape 完全變了，需要看 `node_modules/@mysten/sui/dist/client/types.d.mts` 的 `ListOwnedObjectsResponse` 確認 fields。

#### `useCurrentAccount` 回傳的是 `UiWalletAccount`（wallet-standard）
- `account.address` 仍是 `string`（OK）
- `account.publicKey` 形式可能不同
- 沒有 `account.chains` 屬性 → 若有用，改從 `useCurrentNetwork()` 拿

#### `queryEvents` 沒有 gRPC 端點，用 fallback
```ts
import { getJsonRpcFallbackClient } from '@/app/providers';
const events = await getJsonRpcFallbackClient().queryEvents({
  query: { MoveEventType: `${PACKAGE_ID}::space::FanAvatarAdded` },
});
```
唯一目前用 `queryEvents` 的是 `components/space/hooks/useSpaceSubscribers.ts`。長期應改成讀 `FanRegistry` dynamic fields 而不是事件。

#### `services/contentIndexer.ts` 與 `services/sealContent.ts`
這兩個 service 直接 `import { SuiClient, getFullnodeUrl, SuiEvent } from '@mysten/sui/client'`。新版 v2 的 `client` 子模組只 export 通用型別，沒有 concrete `SuiClient`。改法：
- 想要 gRPC：`import { SuiGrpcClient } from '@mysten/sui/grpc'`
- 想要 JSON-RPC：`import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc'`
- `SuiEvent` 型別：從 `@mysten/sui/jsonRpc` 拿，或自己宣告 interface
- `sealContent.ts` 應該改成接收外部傳入的 client 而不是自己 new 一個

#### 舊版 `signAndExecute({ transaction })` 的 transaction 物件
新版 dAppKit 接受 `Transaction | string`（BCS-serialized）。`@mysten/sui/transactions` 的 `Transaction` 物件直接傳即可。

#### Kiosk
`Network` enum 已從 `@mysten/kiosk` 移除。所有 `Network.MAINNET` / `Network.TESTNET` 改成字串字面值 `'mainnet'` / `'testnet'`。

### Part D（Part 3 + Part 1）

完成 Part C 後再依原計畫的順序做：
1. **Part 3 訂閱續訂**（Move + RenewButton + Settings 列表 + 新 access status）
2. **Part 1 3D 三層共創重構**（最大刪除量，留最後）

---

## Context

目前 Atrium 累積了三類技術債務需要一次清理：

1. **3D 場景過度膨脹且有 bug**：`AtriumGalleryScene.ts` 2666 行、`SpecialEffects.ts` 1401 行，整個 3D 系統約 5000 行；用 CoinGecko 價格 + POE/Claude API 生成「天氣參數」的設計與 Atrium「創作者訂閱空間」的本質脫節，且有 race condition、deprecated 函式、雙重 fallback 等問題。需要瘦身並換成更貼近產品語意的資料源。

2. **Sui 依賴落後且仍在 JSON-RPC**：目前用 legacy `@mysten/dapp-kit@^0.19.9`、`@mysten/sui@^1.45.0`，走 `getFullnodeUrl('testnet')` 的 JSON-RPC。Mysten 官方已將 dApp Kit 拆成 `@mysten/dapp-kit-core` + `@mysten/dapp-kit-react`，並要求新專案改用 `SuiGrpcClient`。legacy 包不會再支援 gRPC/GraphQL。`ConnectButton` 的 theming 從 JS theme object 改為 CSS 變數（shadcn 相容）。

3. **訂閱過期沒有身分轉換、無續訂 UI**：Move 端 `renew_subscription` 與 `transactions.ts` 的 `renewSubscription()` 已經寫好，但 (a) 沒有任何 UI 入口；(b) `is_subscribed()` 接受 `Clock` 卻沒檢查 expiry；(c) `getAccessStatus()` 沒有 `expired` 狀態，過期者直接被當成 `user_unsubscribed`，UI/3D/Seal 行為不一致。

本次目標：完成 1+2+3，並為 (4) Stable Layer 訂閱付款留好擴充點（本次不實作）。

---

## Part 1 — 3D 場景瘦身與資料源重設計

### 1.1 換掉「加密幣天氣」資料源 — 三層共創表達

**移除**：
- `frontend/services/chainDataApi.ts`（CoinGecko + Fear&Greed，459 行）
- `frontend/services/timeFactors.ts` 的 `applyTimeOverrides` 與特殊節日邏輯（保留純粹時段計算）
- `frontend/services/poeApi.ts` 與 `frontend/app/api/ai-weather/route.ts`（移除 LLM 依賴與 fallback weather，約 600 行）
- `frontend/components/3d/hooks/useAIWeather.ts`（170 行）
- `frontend/config/aiPrompts.ts`

**改用「Co-Created Space Expression」三層資料模型**：場景是「創作者打下的舞台 × 訪客留下的痕跡 × 整個 Atrium 共享的時刻」，每一層分別來自不同主體，彼此疊加。

#### Layer A — Global Pulse（所有 space 共享、所有人看到一樣）
| 視覺維度 | 資料來源 |
|---|---|
| 日夜 / 黃昏色溫 | 本機時間（保留 `timeFactors.getTimeOfDay()`） |
| 全平台心跳（背景星塵密度、極遠處光暈） | 全 Atrium 過去 24h 新增訂閱事件總數 |
| 共享「節氣」種子（影響粒子色相偏移） | 以 UTC 日期為 seed 的 deterministic hash，每天全平台同步變化 |

實作：新增 `frontend/services/atriumPulse.ts`，用 `queryEvents({ MoveEventType: SubscriptionCreated })` 撈最近 24h 全平台事件數，cache 在 `localStorage`，5 分鐘 TTL。所有 space 共用同一份結果。

#### Layer B — Creator Foundation（per-space，創作者打下的舞台基底）
| 視覺維度 | 資料來源 |
|---|---|
| 浮島形態（geometric / laputa / grand） | subscriber 階段（0 / 1-9 / 10+ / 100+） |
| 主舞台底色 / 材質 | creator tenure（`Identity.created_at` 與 `Space.created_at`） |
| 中央光柱高度 | space 內 content 總數 |
| 守護石數量 | content 中已加密數（代表創作者投入的「秘密」） |
| 觀眾席座位數 | 訂閱者上限的視覺表達 |

來源 hook：`useSpaceSubscribers`（已存在）+ `useSpaceContent`（已存在）+ 新增 `useCreatorTenure`（讀 `Space.created_at`、`Identity.created_at`）。

#### Layer C — Visitor Trace（per-viewer，訪客自己留下的痕跡）
| 視覺維度 | 資料來源 |
|---|---|
| 進場時的「漣漪」 | 當前訪客錢包是否已連線、是否有 Identity NFT |
| 守護石軌道速度 / 共鳴 | 訪客個人在這個 space 的訪問次數（localStorage） |
| 環境粒子是否聚向訪客視角 | 訪客的訂閱狀態（subscribed → 粒子向螢幕聚集，guest → 粒子散亂） |
| 即時「在場」表達（光點數量） | 同一 space 當前線上人數（presence channel；若無即時通道則用「最近 5 分鐘內查詢過此 space 的不重複錢包」近似） |
| 訪客自己頭像所在的浮台會發光 | 當前帳號比對訂閱者列表 |

來源 hook：`useCurrentAccount`（dapp-kit）+ 新增 `useVisitorTrace`（localStorage 訪問計數 + 訂閱狀態）+ 可選的 `usePresence`（近似即時，從 `queryEvents` 衍生）。

#### 聚合層：`useSpacePulse`
新增 `frontend/components/3d/hooks/useSpacePulse.ts`：把 A+B+C 三層合併成單一 `SpacePulseParams` 物件丟給 `SceneManager.updatePulseParams()`。每層的影響權重在這個 hook 內顯式列出，方便日後調整「誰的貢獻多大」。

語意：場景不再是外部市場的天氣預報，而是「**這個 space 是誰的家、誰來過、現在全 Atrium 怎麼了**」三件事疊加出的視覺表達。創作者越用越深會看到自己的舞台變化，訪客的每次造訪會留下 trace，全平台的動態會作為共享背景。

### 1.2 程式碼瘦身

**新增（小檔）**：
- `frontend/components/3d/hooks/useSpacePulse.ts`：把 subscriber count、content count、最近事件時間、time of day 聚合成 `SpacePulseParams`（約 80 行）。

**保留並重構**：
- `lib/three/SceneManager.ts`：保留，但移除 model 序列化死碼（line 529 周邊）、合併 floating animation（與 ThreeScene 內重複）。
- `lib/three/AtriumGalleryScene.ts`：刪除 `createFloatingIslandBase_DEPRECATED()`（~150 行）、`createCentralLightBeam()`、`createAudienceAreaDebugVisual()`、所有 `// DEBUG REMOVED`。把 `updateWeatherParams()` 改名為 `updatePulseParams()`，內部 switch 從 30+ 種 weather effect 縮成約 6 種「pulse 強度級距」（calm/active/lively/burst + day/night）。預估從 2666 行降到 ~1200 行。
- `lib/three/effects/SpecialEffects.ts`：保留 5 種核心 effect（sparkles、orbs、light beam、ambient dust、guardian aura），其餘（meteor、aurora、rainbow、fireball、confetti、snowfall、birds、lightning、fire_ring、shooting_star…）全刪。預估從 1401 行降到 ~400 行。
- `lib/three/effects/WaterEffects.ts`：簡化為 2 種（calm/active），刪掉 frozen/turbulent。
- `components/3d/ThreeScene.tsx`：把 inline 的 `createFloatingPlatform`（lines 382-459）搬進 `AtriumGalleryScene`，瘦掉 `useImperativeHandle` 重複委派。預估從 604 行降到 ~300 行。

**修 bug**：
- ThreeScene mode toggle race condition：用 `useEffect` 同步 `isDynamicMode` 而非每次 render 重算。
- Subscriber avatar memory leak：把 `loadedModelsMap` 與 `useThreeScene.loadedModels` 合一。
- 模型載入失敗時掛 placeholder 而非靜默 skip。

預估總刪除量：**~3000 行**（從 ~5000 → ~2000）。

### 1.3 關鍵檔案
- `frontend/components/3d/ThreeScene.tsx`
- `frontend/lib/three/AtriumGalleryScene.ts`
- `frontend/lib/three/SceneManager.ts`
- `frontend/lib/three/effects/SpecialEffects.ts`
- `frontend/lib/three/effects/WaterEffects.ts`
- `frontend/components/3d/hooks/useThreeScene.ts`
- `frontend/components/3d/hooks/useSpacePulse.ts`（新，聚合 A+B+C）
- `frontend/services/atriumPulse.ts`（新，Layer A 全平台事件）
- `frontend/components/3d/hooks/useCreatorTenure.ts`（新，Layer B 創作者資歷）
- `frontend/components/3d/hooks/useVisitorTrace.ts`（新，Layer C 訪客個人狀態 + presence 近似）

---

## Part 2 — Sui SDK 升級到 dapp-kit-react + gRPC

### 2.1 依賴變更（`frontend/package.json`）

移除：
```
"@mysten/dapp-kit": "^0.19.9"
```

新增 / 升級：
```
"@mysten/dapp-kit-react": "latest"
"@mysten/sui": "latest"      // 升 2.x
"@mysten/kiosk": "latest"
"@mysten/seal": "latest"
```

`@tanstack/react-query` 維持不變（dapp-kit-react 仍依賴）。

### 2.2 Provider 重寫

**檔案**：`frontend/app/providers.tsx`

從現在的 `SuiClientProvider` + `WalletProvider` + `retroWhiteTheme` (JS object) 改為：

```ts
import { createDAppKit, DAppKitProvider } from '@mysten/dapp-kit-react';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import '@mysten/dapp-kit-react/styles.css';

const dAppKit = createDAppKit({
  networks: ['testnet'],
  defaultNetwork: 'testnet',
  createClient: (network) => new SuiGrpcClient({
    network,
    baseUrl: 'https://fullnode.testnet.sui.io:443',
  }),
});

<QueryClientProvider client={queryClient}>
  <DAppKitProvider dAppKit={dAppKit}>
    <KioskClientProvider networkName="testnet">{children}</KioskClientProvider>
  </DAppKitProvider>
</QueryClientProvider>
```

### 2.3 ConnectButton 樣式遷移

新版 `ConnectButton` 使用 CSS 變數（shadcn 相容）取代 JS theme object。

**移除**：`frontend/config/walletTheme.ts`（整個 retroWhiteTheme JS 物件）

**新增**：`frontend/app/dapp-kit-overrides.css`，把目前 `walletTheme.ts` 的視覺值對應到 CSS 變數：

```css
:root {
  --dapp-kit-radius: 0px;
  --dapp-kit-background: #f3f4f6;
  --dapp-kit-foreground: #1f2937;
  --dapp-kit-primary: #f3f4f6;
  --dapp-kit-primary-foreground: #1f2937;
  --dapp-kit-border: #d1d5db;
  --dapp-kit-font-family: Georgia, serif;
  /* …其餘以 walletTheme.ts 既有值對應 */
}
.dapp-kit-connect-button {
  box-shadow: inset 1px 1px 2px rgba(0,0,0,0.05);
  font-size: 12px;
}
```

在 `app/layout.tsx` import 該 CSS。視覺結果與舊版 `retroWhiteTheme` 一致。

### 2.4 Hook / API 遷移

逐檔改 import path：
- `useCurrentAccount`、`useSuiClient`、`useSignAndExecuteTransaction`、`ConnectButton`：從 `@mysten/dapp-kit` → `@mysten/dapp-kit-react`
- 受影響檔（grep `@mysten/dapp-kit`）：`app/page.tsx`、`components/settings/SettingsPage.tsx`、`components/identity/IdentityRegistration.tsx`、`components/identity/hooks/useIdentity.ts`、`components/identity/hooks/useWalletSignature.ts`、`components/identity/hooks/useCreatorIdentity.ts`、`components/space/hooks/useSpaceAccess.ts`、`components/space/hooks/useSpaceSubscribers.ts`、`components/space/hooks/useSubscribedSpaces.ts`、`components/space/hooks/useUserSpaces.ts`、`components/space/nft/hooks/useKioskData.ts`、`components/space/nft/hooks/useKioskListedItems.ts`、`components/layout/Sidebar.tsx`
- `useSuiClient()` 回傳的 client 介面從 JSON-RPC 換成 gRPC：`getOwnedObjects`、`getObject`、`queryEvents` 在 2.x 多數簽名相容，但少數欄位名稱（如 `data.content.fields`）改變，需逐處驗證。最關鍵的 call sites：
  - `useIdentity.ts`：`getOwnedObjects({ filter: { StructType } })`
  - `useSpaceSubscribers.ts`：`queryEvents({ query: { MoveEventType } })`
  - `useUserSpaces.ts`：SpaceOwnership 查詢
- `KioskClientProvider`（`components/providers/KioskClientProvider.tsx`）：傳入的 client 從 JSON-RPC client 改 gRPC client。
- `services/sealContent.ts`：同樣換用 gRPC client 介面。

**Kiosk / Seal 相容策略（全面 gRPC，必要時 fork）**：
1. 先試官方最新版 `@mysten/kiosk`、`@mysten/seal` 直接傳入 `SuiGrpcClient`。
2. 若型別不符或 runtime 報錯：開 `pnpm patch` 或 fork，把內部對 JSON-RPC client 的呼叫換成 gRPC client 對應方法（多數是 `getOwnedObjects` / `getObject` / `multiGetObjects` / `dryRunTransactionBlock`，gRPC client 都有對應）。
3. Fork 採子模組或 monorepo workspace 形式放 `frontend/vendored/`，commit message 標明對應上游 commit hash 與差異，方便日後上游修好後移除。
4. 若 fork 規模過大（>200 行修改）才退回「Kiosk/Seal 內部保留 JSON-RPC client，主 app 走 gRPC」的混用模式，但此情況需在 PR 描述明確標記為臨時方案。

### 2.5 關鍵檔案
- `frontend/package.json`
- `frontend/app/providers.tsx`
- `frontend/app/layout.tsx`
- `frontend/app/dapp-kit-overrides.css`（新）
- `frontend/config/walletTheme.ts`（刪）
- 上述所有 hook/component import 改寫

---

## Part 3 — 訂閱續訂與身分轉換

### 3.1 Move 合約調整

**檔案**：`contract/sources/subscription.move`

(a) 修 `is_subscribed()`：實際使用 `Clock` 檢查 expiry：
```move
public fun is_subscribed(
    registry: &SubscriptionRegistry,
    subscriber: address,
    space_id: ID,
    clock: &Clock,
): bool {
    if (!is_subscribed_internal(registry, subscriber, space_id)) return false;
    // 透過 registry 拿 subscription_id，但 Subscription 是 owned NFT 不在 registry 內，
    // 因此這個函式只能回報「曾經訂閱」。實際 expiry 檢查由持有 NFT 的入口（seal_approve）負責。
    true
}
```
→ 改為新增 `is_subscription_active(subscription: &Subscription, clock: &Clock): bool` 並讓 frontend 直接讀 NFT 的 `expires_at` 比對 client clock，避免合約端假檢查。

(b) `renew_subscription` 補上 FanRegistry 同步：續訂時若該 space 的 fan avatar 已被清除（未來會做的清掃），重新 `add_fan_avatar`。

(c) 新增事件 `SubscriptionExpired` (option)：方便鏈下索引。本次先不加，避免擴大範圍。

### 3.2 Frontend 身分狀態擴充

**檔案**：`frontend/components/space/ui/AccessStatusIndicator.tsx`

```ts
export type AccessStatus =
  | "guest"
  | "user_unsubscribed"
  | "subscribed"
  | "subscription_expired"   // 新
  | "creator";

export function getAccessStatus(account, subscriptionNft, isCreator, nowMs) {
  if (isCreator) return "creator";
  if (!account) return "guest";
  if (!subscriptionNft) return "user_unsubscribed";
  if (subscriptionNft.expires_at < nowMs) return "subscription_expired";
  return "subscribed";
}
```

**新 hook**：`frontend/hooks/useSpaceSubscription.ts`（已存在，需擴充）
- 回傳 `{ subscriptionId, expiresAt, isActive, isExpired, daysRemaining }`
- 用 `Date.now()` 對比 `expires_at`，每分鐘重算一次（`useEffect` + interval）

### 3.3 RenewButton UI

**新增**：`frontend/components/subscription/RenewButton.tsx`

仿照 `SubscribeButton.tsx` 結構：
- props：`subscriptionId, spaceId, currentExpiresAt, priceInMist, creatorAddress, onRenewed`
- 內部 `duration` selector（30/90/180/365）
- 顯示 "Expires in X days" / "Expired N days ago"
- 呼叫已存在的 `renewSubscription()`（`utils/transactions.ts:274`）
- 成功後 invalidate `useSpaceSubscription` 與 `useSubscribedSpaces` 的 query

### 3.4 在 UI 中暴露續訂入口

在以下兩處新增 RenewButton：

**(a) Space 頁面右側 access panel**：當 `accessStatus === "subscribed"` 顯示「Renew / Extend」次按鈕；當 `=== "subscription_expired"` 顯示主要 CTA「Renew Subscription」並把鎖定內容變灰。

**(b) Settings → Subscriptions 列表（本次新建）**：

`frontend/components/settings/SettingsPage.tsx` 目前沒有訂閱列表 section，本次補上：
- 在現有 Settings 分區新增 `Subscriptions` 區塊
- 用既有的 `useSubscribedSpaces()` 取得清單（已存在於 `frontend/hooks/useSubscribedSpaces.ts`），但需擴充：補抓每一筆 `Subscription` NFT 的 `expires_at`
- 用 `RetroPanel` 風格列出每個 subscribed space：
  - space 名稱 / cover thumbnail
  - expiry 倒數（"Expires in 12 days" / 紅字 "Expired 3 days ago"）
  - Renew 按鈕（沿用同一個 `<RenewButton />` 元件，傳不同 props）
  - 連到該 space 的連結
- 空狀態：「You haven't subscribed to any space yet」

新增檔案：`frontend/components/settings/SubscriptionsSection.tsx`

### 3.5 身分轉換的副作用處理

當 `subscription_expired`：
- `useSpaceContent` 把 `isLocked: c.encrypted` 的內容仍標 locked，但顯示「Subscription expired — renew to unlock」
- 3D 場景：訂閱者頭像仍出現在 FanRegistry 中（鏈上未清），但本地 hook 過濾掉 expired 的自己（避免創作者看到「殭屍訂閱者」誤導）→ 等清掃 job 上線再處理鏈上端
- Seal 解密：原本就會在 `seal_approve_as_subscriber` abort，無需 frontend 額外處理

### 3.6 關鍵檔案
- `contract/sources/subscription.move`
- `frontend/utils/transactions.ts`（已有 `renewSubscription`，無需改）
- `frontend/hooks/useSpaceSubscription.ts`（擴充）
- `frontend/hooks/useSubscribedSpaces.ts`（擴充：補抓 expires_at）
- `frontend/components/space/ui/AccessStatusIndicator.tsx`
- `frontend/components/subscription/RenewButton.tsx`（新）
- `frontend/components/subscription/SubscribeButton.tsx`（在已訂閱時改顯示 RenewButton）
- `frontend/components/space/hooks/useSpaceContent.ts`（顯示 expired 提示）
- `frontend/components/settings/SubscriptionsSection.tsx`（新）
- `frontend/components/settings/SettingsPage.tsx`（嵌入新 section）

---

## Part 4 — Stable Layer 預留（不在本次實作）

只在 Move 端做最小準備：把 `subscribe()` 與 `renew_subscription()` 的 `Coin<SUI>` 抽出常數別名 `type PaymentCoin = Coin<SUI>`，並在註解標記未來改 generic `Coin<T>` 的位置。Frontend 不動。

---

## 驗證

1. **3D**：`pnpm dev`，打開任意 space，確認場景能在「0 訂閱者 / 1+ 訂閱者 / 新增 content / 日夜切換」四種情境下視覺有差，且無 console error。FPS 不低於重構前。
2. **Sui SDK**：
   - `pnpm build` 通過、`tsc --noEmit` 無錯
   - ConnectButton 視覺與舊版 retro 風一致（截圖比對）
   - 連 wallet → mint identity → 創建 space → 訂閱 → 取消連線 → 重連，全部流程不報錯
   - Network tab 確認所有 RPC 為 gRPC（HTTP/2 + protobuf）而非 JSON-RPC POST
3. **訂閱續訂**：
   - 建立 1 day 訂閱，等到過期，UI 顯示 `subscription_expired`，加密內容鎖定
   - 點 RenewButton 續訂 30 天，UI 切回 `subscribed`，內容解鎖
   - 在 active 狀態下續訂 +30 天，`expires_at` 累加而非重置（讀 NFT 驗證）
   - 過期後續訂，`expires_at = now + 30 days`（grace 重置）
4. **Move 單元測試**：`sui move test`，新增 `test_renew_active_extends`、`test_renew_expired_resets`。

---

## 風險與順序建議

1. **先做 Part 2（Sui 升級）**：影響面最大但最機械化，先完成可避免後續工作雙工。
2. **再做 Part 3（訂閱續訂）**：合約端只小改，前端是新增為主，相對獨立。
3. **最後做 Part 1（3D 重構）**：最大刪除量、最容易視覺出包，留到最後讓主流程已穩定後再動。
