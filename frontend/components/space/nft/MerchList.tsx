import { MerchCard } from "./MerchCard";
import { RetroPanel } from "@/components/common/RetroPanel";
import { useKioskListedItems } from "@/hooks/useKioskListedItems";
import { StateContainer } from "@/components/common/StateContainer";

interface MerchListProps {
  kioskId: string;
  onViewIn3D?: (nftId: string) => void;
  onPurchase: (nftId: string, nftType: string, price: string) => Promise<void>;
}

export function MerchList({ kioskId, onViewIn3D, onPurchase }: MerchListProps) {
  const { listedItems, loading, error, refetch } = useKioskListedItems(kioskId);

  return (
    <StateContainer
      loading={loading}
      error={error}
      empty={listedItems.length === 0}
    >
      <StateContainer.Loading>
        <div className="grid grid-cols-1 gap-3">
          {[...Array(3)].map((_, i) => (
            <RetroPanel key={i} variant="inset" className="h-64 animate-pulse">
              <div />
            </RetroPanel>
          ))}
        </div>
      </StateContainer.Loading>

      <StateContainer.Empty
        icon="🛍️"
        title="No Items Listed"
        message="This space doesn't have any items for sale yet."
      />

      <StateContainer.Content>
        <div className="grid grid-cols-1 gap-3">
          {listedItems.map((nft) => (
            <MerchCard
              key={nft.id}
              nft={nft}
              onViewIn3D={onViewIn3D}
              onPurchase={onPurchase}
              onPurchaseSuccess={refetch}
            />
          ))}
        </div>
      </StateContainer.Content>
    </StateContainer>
  );
}

