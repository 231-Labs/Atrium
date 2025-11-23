import { useCurrentAccount } from '@mysten/dapp-kit';

interface SpaceData {
  id?: string;
  kioskId?: string;
  name?: string;
  description?: string;
  coverImage?: string;
  configQuilt?: string;
  subscriptionPrice?: string;
  creator?: string;
  videoBlobs?: string[];
}

interface SafeSpaceData {
  id: string;
  kioskId: string;
  name: string;
  description: string;
  coverImage: string;
  configQuilt: string;
  subscriptionPrice: string;
  creator: string;
  videoBlobs: string[];
}

export function useSpaceData() {
  const currentAccount = useCurrentAccount();

  const getSafeSpace = (space?: SpaceData | null, spaceId?: string): SafeSpaceData => {
    if (space) {
      return {
        id: space.id || space.kioskId || spaceId || "",
        kioskId: space.kioskId || space.id || spaceId || "",
        name: space.name || "Loading Space...",
        description: space.description || "Please wait while we load the space content.",
        coverImage: space.coverImage || "",
        configQuilt: space.configQuilt || "",
        subscriptionPrice: space.subscriptionPrice || "0",
        creator: space.creator || "",
        videoBlobs: space.videoBlobs || [],
      };
    }

    return {
      id: spaceId || "",
      kioskId: spaceId || "",
      name: "Loading Space...",
      description: "Please wait while we load the space content.",
      coverImage: "",
      configQuilt: "",
      subscriptionPrice: "0",
      creator: "",
      videoBlobs: [],
    };
  };

  const isSpaceCreator = (space: SpaceData | SafeSpaceData): boolean => {
    if (!currentAccount?.address || !space.creator) return false;
    return currentAccount.address.toLowerCase() === space.creator.toLowerCase();
  };

  const formatAddress = (address: string, start: number = 6, end: number = 4): string => {
    if (!address) return '';
    if (address.length < start + end + 2) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  return { getSafeSpace, isSpaceCreator, formatAddress };
}

