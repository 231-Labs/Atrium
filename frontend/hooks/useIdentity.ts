import { useEffect, useState } from 'react';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/config/sui';

export interface Identity {
  id: string;
  content: any;
  display: any;
}

export interface UseIdentityReturn {
  identity: Identity | null;
  hasIdentity: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useIdentity(): UseIdentityReturn {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIdentity = async () => {
    if (!currentAccount) {
      setIdentity(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await suiClient.getOwnedObjects({
        owner: currentAccount.address,
        filter: { StructType: `${PACKAGE_ID}::identity::Identity` },
        options: { showContent: true, showDisplay: true }
      });

      if (data.length > 0) {
        const obj = data[0];
        setIdentity({
          id: obj.data?.objectId || '',
          content: obj.data?.content,
          display: obj.data?.display?.data
        });
      } else {
        setIdentity(null);
      }
    } catch (error) {
      console.error('Failed to fetch identity:', error);
      setIdentity(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentAccount?.address]);

  return {
    identity,
    hasIdentity: !!identity,
    loading,
    refetch: fetchIdentity,
  };
}

