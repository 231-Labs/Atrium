import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { MIST_PER_SUI, SUI_CHAIN } from '@/utils/transactions';

interface UseKioskListingResult {
  listNFT: (kioskId: string, kioskCapId: string, itemId: string, itemType: string, priceInSui: number) => Promise<void>;
  delistNFT: (kioskId: string, kioskCapId: string, itemId: string, itemType: string) => Promise<void>;
  isListing: boolean;
}

export function useKioskListing(): UseKioskListingResult {
  const { mutateAsync: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const listNFT = async (
    kioskId: string,
    kioskCapId: string,
    itemId: string,
    itemType: string,
    priceInSui: number
  ) => {
    console.log('🔶 useKioskListing.listNFT called with:', {
      kioskId,
      kioskCapId,
      itemId,
      itemType,
      priceInSui
    });
    
    const tx = new Transaction();
    const priceInMist = Math.floor(priceInSui * MIST_PER_SUI);
    
    console.log('🔶 Price in MIST:', priceInMist);
    console.log('🔶 Building transaction...');

    tx.moveCall({
      target: '0x2::kiosk::list',
      typeArguments: [itemType],
      arguments: [
        tx.object(kioskId),
        tx.object(kioskCapId),
        tx.pure.id(itemId),
        tx.pure.u64(priceInMist),
      ],
    });

    console.log('🔶 Calling signAndExecute...');
    
    await signAndExecute(
      {
        transaction: tx,
        chain: SUI_CHAIN,
      },
      {
        onSuccess: () => {
          console.log('✅ NFT listed successfully in blockchain');
        },
        onError: (error) => {
          console.error('❌ Failed to list NFT in blockchain:', error);
          throw error;
        },
      }
    );
    
    console.log('🔶 signAndExecute completed');
  };

  const delistNFT = async (
    kioskId: string,
    kioskCapId: string,
    itemId: string,
    itemType: string
  ) => {
    const tx = new Transaction();

    tx.moveCall({
      target: '0x2::kiosk::delist',
      typeArguments: [itemType],
      arguments: [
        tx.object(kioskId),
        tx.object(kioskCapId),
        tx.pure.id(itemId),
      ],
    });

    await signAndExecute(
      {
        transaction: tx,
        chain: SUI_CHAIN,
      },
      {
        onSuccess: () => {
          console.log('NFT delisted successfully');
        },
        onError: (error) => {
          console.error('Failed to delist NFT:', error);
          throw error;
        },
      }
    );
  };

  return {
    listNFT,
    delistNFT,
    isListing: isPending,
  };
}

