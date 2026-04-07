import { useState } from 'react';
import { useDAppKit } from '@mysten/dapp-kit-react';
import { Transaction } from '@mysten/sui/transactions';
import { MIST_PER_SUI } from '@/utils/transactions';

interface UseKioskListingResult {
  listNFT: (kioskId: string, kioskCapId: string, itemId: string, itemType: string, priceInSui: number) => Promise<void>;
  delistNFT: (kioskId: string, kioskCapId: string, itemId: string, itemType: string) => Promise<void>;
  isListing: boolean;
}

export function useKioskListing(): UseKioskListingResult {
  const dAppKit = useDAppKit();
  const [isListing, setIsListing] = useState(false);

  const listNFT = async (
    kioskId: string,
    kioskCapId: string,
    itemId: string,
    itemType: string,
    priceInSui: number
  ) => {
    const tx = new Transaction();
    const priceInMist = Math.floor(priceInSui * MIST_PER_SUI);

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

    setIsListing(true);
    try {
      await dAppKit.signAndExecuteTransaction({ transaction: tx });
      console.log('NFT listed successfully');
    } catch (error) {
      console.error('Failed to list NFT:', error);
      throw error;
    } finally {
      setIsListing(false);
    }
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

    setIsListing(true);
    try {
      await dAppKit.signAndExecuteTransaction({ transaction: tx });
      console.log('NFT delisted successfully');
    } catch (error) {
      console.error('Failed to delist NFT:', error);
      throw error;
    } finally {
      setIsListing(false);
    }
  };

  return {
    listNFT,
    delistNFT,
    isListing,
  };
}
