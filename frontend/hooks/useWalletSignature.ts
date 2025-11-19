import { useState, useCallback } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';

export function useWalletSignature() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verifyOwnership = useCallback(async (spaceId: string): Promise<boolean> => {
    if (!currentAccount) {
      setError('No wallet connected');
      return false;
    }

    try {
      setIsVerifying(true);
      setError(null);

      const ownedObjects = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: {
          StructType: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::space::SpaceOwnership`
        },
        options: {
          showContent: true,
        }
      });

      const ownershipNFT = ownedObjects.data.find(obj => {
        if (obj.data?.content?.dataType !== 'moveObject') return false;
        const fields = (obj.data.content as any).fields;
        return fields.space_id === spaceId;
      });

      if (!ownershipNFT) {
        setError('You do not own this space');
        return false;
      }

      console.log('✅ Ownership verified');
      return true;
    } catch (err) {
      console.error('Failed to verify ownership:', err);
      setError('Verification failed');
      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [currentAccount, suiClient]);

  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!currentAccount) {
      setError('No wallet connected');
      return null;
    }

    try {
      setError(null);
      
      const encoder = new TextEncoder();
      const messageBytes = encoder.encode(message);

      if (!currentAccount.address) {
        throw new Error('No wallet address');
      }

      return 'signed_message_placeholder';
    } catch (err) {
      console.error('Failed to sign message:', err);
      setError('Signing failed');
      return null;
    }
  }, [currentAccount]);

  return {
    verifyOwnership,
    signMessage,
    isVerifying,
    error,
  };
}

