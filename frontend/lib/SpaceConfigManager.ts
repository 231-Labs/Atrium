interface SceneObject {
  nftId: string;
  objectType: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
  displayed: boolean;
}

interface SpaceConfig {
  version: string;
  objects: SceneObject[];
  metadata?: {
    category?: string;
    tags?: string[];
    updatedAt?: number;
  };
}

export function createSpaceConfig(
  nftTransforms: Map<string, any>,
  visibleNFTs: Set<string>,
  nfts: any[],
  metadata?: SpaceConfig['metadata']
): SpaceConfig {
  const objects: SceneObject[] = nfts.map(nft => {
    const transform = nftTransforms.get(nft.id) || {
      position: [0, 1, 0],
      rotation: [0, 0, 0],
      scale: 1,
    };

    return {
      nftId: nft.id,
      objectType: nft.objectType || '3d',
      position: {
        x: transform.position[0],
        y: transform.position[1],
        z: transform.position[2],
      },
      rotation: {
        x: transform.rotation[0],
        y: transform.rotation[1],
        z: transform.rotation[2],
      },
      scale: transform.scale,
      displayed: visibleNFTs.has(nft.id),
    };
  });

  return {
    version: '1.0',
    objects,
    metadata: {
      ...metadata,
      updatedAt: Date.now(),
    },
  };
}

export function parseSpaceConfig(config: SpaceConfig): {
  visibleNFTs: Set<string>;
  nftTransforms: Map<string, any>;
} {
  const visibleNFTs = new Set<string>();
  const nftTransforms = new Map();

  config.objects.forEach(obj => {
    if (obj.displayed) {
      visibleNFTs.add(obj.nftId);
    }

    nftTransforms.set(obj.nftId, {
      position: [obj.position.x, obj.position.y, obj.position.z],
      rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z],
      scale: obj.scale,
    });
  });

  return { visibleNFTs, nftTransforms };
}

