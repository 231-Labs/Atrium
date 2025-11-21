# Space 模組架構

本資料夾已重新組織為模組化結構，便於維護和復用。

## 📁 資料夾結構

```
space/
├── display/          # 空間展示相關組件 (7個)
│   ├── SpaceDetail.tsx           - 空間詳情頁面（主要組件）
│   ├── SpacePreviewWindow.tsx    - 空間預覽視窗
│   ├── SpaceCard.tsx             - 空間卡片
│   ├── SpaceList.tsx             - 空間列表
│   ├── SpaceInfoCard.tsx         - 空間資訊卡片
│   ├── LandingPageView.tsx       - 落地頁視圖
│   ├── SubscribedSpaces.tsx      - 訂閱的空間列表
│   └── index.ts                  - 統一導出
│
├── creation/         # 創建/編輯空間相關 (3個)
│   ├── CreateSpaceButton.tsx     - 創建空間按鈕
│   ├── CreateSpaceForm.tsx       - 創建空間表單
│   ├── ScreenConfig.tsx          - 螢幕配置組件
│   └── index.ts                  - 統一導出
│
├── content/          # 內容管理相關 (5個)
│   ├── ContentManager.tsx        - 內容管理器
│   ├── ContentUploadModal.tsx    - 內容上傳模態框
│   ├── ContentItem.tsx           - 內容項目
│   ├── ContentList.tsx           - 內容列表
│   ├── StoragePanel.tsx          - 儲存面板
│   └── index.ts                  - 統一導出
│
├── media/            # 媒體處理相關 (3個)
│   ├── VideoUpload.tsx           - 視頻上傳
│   ├── VideoList.tsx             - 視頻列表
│   ├── VideoPlayer.tsx           - 視頻播放器
│   └── index.ts                  - 統一導出
│
├── nft/              # NFT 管理相關 (1個)
│   ├── NFTListPanel.tsx          - NFT 列表面板
│   └── index.ts                  - 統一導出
│
├── ui/               # 共用 UI 組件 (4個)
│   ├── SpaceCategoryFilter.tsx   - 空間分類過濾器
│   ├── SpaceActionPanel.tsx      - 空間操作面板
│   ├── AccessStatusIndicator.tsx - 訪問狀態指示器
│   ├── SpaceTabNavigation.tsx    - 空間標籤導航
│   └── index.ts                  - 統一導出
│
├── index.ts          # 主入口 - 統一導出所有模組
└── README.md         # 本文件
```

## 📦 使用方式

### 從主入口導入（推薦）

```typescript
// 導入所有需要的組件
import { 
  SpaceDetail, 
  SpaceList, 
  CreateSpaceForm,
  ContentManager,
  VideoPlayer,
  NFTListPanel,
  SpaceCategoryFilter
} from '@/components/space';
```

### 從子模組導入（更精確）

```typescript
// 只導入展示相關組件
import { SpaceDetail, SpaceList } from '@/components/space/display';

// 只導入創建相關組件
import { CreateSpaceForm } from '@/components/space/creation';

// 只導入內容相關組件
import { ContentManager, ContentList } from '@/components/space/content';

// 只導入媒體相關組件
import { VideoPlayer } from '@/components/space/media';

// 只導入 NFT 相關組件
import { NFTListPanel } from '@/components/space/nft';

// 只導入 UI 組件
import { SpaceCategoryFilter } from '@/components/space/ui';
```

## 🎯 設計原則

1. **模組化** - 按業務邏輯分組，每個子資料夾有明確職責
2. **可復用** - 組件獨立且耦合度低，便於在不同場景復用
3. **易維護** - 結構清晰，新成員可快速定位和理解代碼
4. **可擴展** - 新功能可輕鬆加入相應模組，不影響其他部分

## 📋 組件分類說明

- **display/** - 負責空間的展示、列表、卡片等視覺呈現
- **creation/** - 處理空間的創建、編輯、配置等操作
- **content/** - 管理空間內的內容（文章、商品等）
- **media/** - 處理視頻等多媒體內容
- **nft/** - 管理 NFT 相關功能
- **ui/** - 可復用的通用 UI 組件

## 🔄 遷移說明

原有的導入路徑已全部更新：

```typescript
// 舊的導入方式 ❌
import { SpaceDetail } from '@/components/space/SpaceDetail';
import { SpaceList } from '@/components/space/SpaceList';

// 新的導入方式 ✅
import { SpaceDetail, SpaceList } from '@/components/space/display';
// 或
import { SpaceDetail, SpaceList } from '@/components/space';
```

所有現有的引用已經更新，不需要額外的遷移工作。

## 📌 注意事項

- 每個子資料夾都有 `index.ts` 文件統一導出
- 組件內部已更新為相對路徑導入
- 類型定義也通過 `index.ts` 導出，方便使用

