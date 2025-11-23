import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { MIST_PER_SUI, SUI_CHAIN } from '@/utils/transactions';

export function usePurchaseNFT() {
  const { mutateAsync: signAndExecute, isPending } = useSignAndExecuteTransaction();

  const purchaseNFT = async (
    sourceKioskId: string,
    nftId: string,
    nftType: string,
    priceInMist: string,
    destinationKioskId: string,
    destinationKioskCapId: string
  ) => {
    const tx = new Transaction();

    const [payment] = tx.splitCoins(tx.gas, [tx.pure.u64(priceInMist)]);

    const [nft, transferRequest] = tx.moveCall({
      target: '0x2::kiosk::purchase',
      typeArguments: [nftType],
      arguments: [
        tx.object(sourceKioskId),
        tx.pure.id(nftId),
        payment,
      ],
    });

    tx.moveCall({
      target: '0x2::kiosk::place',
      typeArguments: [nftType],
      arguments: [
        tx.object(destinationKioskId),
        tx.object(destinationKioskCapId),
        nft,
      ],
    });

    tx.moveCall({
      target: '0x2::transfer_policy::confirm_request',
      typeArguments: [nftType],
      arguments: [
        tx.object('0x0'),
        transferRequest,
      ],
    });

    await signAndExecute(
      {
        transaction: tx,
        chain: SUI_CHAIN,
      },
      {
        onSuccess: () => {
          console.log('NFT purchased successfully');
        },
        onError: (error) => {
          console.error('Failed to purchase NFT:', error);
          throw error;
        },
      }
    );
  };

  return { purchaseNFT, isPurchasing: isPending };
}

