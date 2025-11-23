import { useState, useCallback } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/config/sui';

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
          StructType: `${PACKAGE_ID}::space::SpaceOwnership`
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

      return true;
    } catch (err) {
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
      return 'signed_message_placeholder';
    } catch (err) {
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

