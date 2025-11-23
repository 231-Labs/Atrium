import { useEffect, useState } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '@/config/sui';

export interface CreatorIdentity {
  id: string;
  content: any;
  display: any;
}

export function useCreatorIdentity(address: string | null) {
  const suiClient = useSuiClient();
  
  const [identity, setIdentity] = useState<CreatorIdentity | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCreatorIdentity() {
      if (!address) {
        setIdentity(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data } = await suiClient.getOwnedObjects({
          owner: address,
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
        setIdentity(null);
      } finally {
        setLoading(false);
      }
    }

    fetchCreatorIdentity();
  }, [address, suiClient]);

  return {
    identity,
    loading,
    hasIdentity: !!identity,
  };
}

