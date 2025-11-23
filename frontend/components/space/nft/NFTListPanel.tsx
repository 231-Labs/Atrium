import { useState, useEffect, useCallback, useRef } from 'react';
import { RetroPanel } from '@/components/common/RetroPanel';
import { RetroButton } from '@/components/common/RetroButton';
import { RetroSlider } from '@/components/common/RetroSlider';
import { useKioskManagement, KioskNFT } from './hooks/useKioskManagement';
import { ObjectTransform } from '@/types/spaceEditor';

interface NFTListPanelProps {
  kioskId: string;
  visibleNFTs: Set<string>;
  objectTransforms: Map<string, ObjectTransform>;
  selectedNFTId?: string | null;
  onToggleVisibility: (nftId: string) => void;
  onScaleChange: (nftId: string, scale: number) => void;
  onTransformChange?: (nftId: string, transform: ObjectTransform) => void;
  onEditTransform?: (nftId: string) => void;
  onSelect?: (nftId: string) => void;
  onList: (nftId: string, price: number) => Promise<void>;
  onDelist: (nftId: string) => Promise<void>;
}

interface NFTItemProps {
  nft: KioskNFT;
  isVisible: boolean;
  isSelected: boolean;
  isListingMode: boolean;
  transform?: ObjectTransform;
  onToggleVisibility: () => void;
  onScaleChange: (scale: number) => void;
  onTransformChange?: (transform: ObjectTransform) => void;
  onSelect: () => void;
  onList: (price: number) => Promise<void>;
  onDelist: () => Promise<void>;
  onToggleListingMode: () => void;
}

function TransformInput({ 
  label, 
  value, 
  onChange,
  min = -10,
  max = 10,
  step = 0.1,
}: { 
  label: string; 
  value: number; 
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [inputValue, setInputValue] = useState(value.toFixed(2));
  const isEditing = useRef(false);
  
  useEffect(() => {
    if (!isEditing.current) {
         setInputValue(value.toFixed(2));
    }
  }, [value]);

  const handleCommit = () => {
    const raw = inputValue.trim();
    const parsed = parseFloat(raw);
    if (Number.isFinite(parsed)) {
        onChange(parsed);
        setInputValue(parsed.toFixed(2));
    } else {
        setInputValue(value.toFixed(2));
    }
    isEditing.current = false;
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-gray-500 font-serif uppercase">
          {label}
        </label>
        <RetroPanel variant="inset" className="p-0 w-12">
            <input
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => { isEditing.current = true; }}
            onBlur={handleCommit}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.currentTarget.blur();
                }
            }}
            className="w-full px-1 py-0.5 text-[10px] text-center bg-transparent border-0 outline-none font-mono text-gray-700"
            />
        </RetroPanel>
      </div>
      <div className="px-0.5">
        <RetroSlider
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
        />
      </div>
    </div>
  );
}

function NFTItem({
  nft,
  isVisible,
  isSelected,
  isListingMode,
  transform,
  onToggleVisibility,
  onScaleChange,
  onTransformChange,
  onSelect,
  onList,
  onDelist,
  onToggleListingMode,
}: NFTItemProps) {
  const effectiveTransform = transform || {
    position: [0, 1, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: 1,
  };
  
  const transformRef = useRef(effectiveTransform);
  transformRef.current = effectiveTransform;
  
  const [scale, setScale] = useState(effectiveTransform?.scale || 1.0);
  const [listPrice, setListPrice] = useState('1.0');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (effectiveTransform?.scale !== undefined) {
      setScale(Math.round(effectiveTransform.scale * 100) / 100);
    }
  }, [effectiveTransform?.scale]);

  const handleScaleChange = useCallback((val: number) => {
    setScale(val);
    onScaleChange(val);
    const currentTransform = transformRef.current;
    if (currentTransform && onTransformChange) {
      onTransformChange({ ...currentTransform, scale: val });
    }
  }, [onScaleChange, onTransformChange]);

  const handlePositionChange = useCallback((axis: 0 | 1 | 2, val: number) => {
    if (!onTransformChange) return;
    const currentTransform = transformRef.current;
    const newPos = [...currentTransform.position] as [number, number, number];
    newPos[axis] = val;
    onTransformChange({ ...currentTransform, position: newPos });
  }, [onTransformChange]);

  const handleRotationChange = useCallback((axis: 0 | 1 | 2, val: number) => {
    if (!onTransformChange) return;
    const currentTransform = transformRef.current;
    const newRot = [...currentTransform.rotation] as [number, number, number];
    newRot[axis] = val;
    onTransformChange({ ...currentTransform, rotation: newRot });
  }, [onTransformChange]);

  const formatSuiPrice = (price?: string) => {
    if (!price) return '0';
    return (parseInt(price) / 1000000000).toFixed(2);
  };

  return (
    <div className="mb-3">
      <RetroPanel 
        variant={isSelected ? "inset" : "outset"}
        className={`transition-all duration-200 ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-stretch p-3 gap-3">
          {/* Left: Thumbnail */}
          <div 
            className="flex-shrink-0 cursor-pointer relative group/thumb"
            onClick={onSelect}
          >
            <RetroPanel variant="inset" className="p-0 w-24 h-24 overflow-hidden bg-white flex items-center justify-center border-2 border-gray-200">
              {nft.imageUrl ? (
                <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110" />
              ) : (
                <div className="text-3xl opacity-30">
                  {nft.objectType === '3d' ? '📦' : '🖼️'}
                </div>
              )}
            </RetroPanel>
          </div>

          {/* Right: Info & Actions */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            {/* Header Info */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <h4 
                  className="font-serif font-bold text-gray-900 truncate text-base leading-tight cursor-pointer hover:text-blue-700"
                  onClick={onSelect}
                  title={nft.name}
                >
                  {nft.name}
                </h4>
                <span className="text-[9px] uppercase tracking-wider font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 whitespace-nowrap flex-shrink-0">
                  {nft.objectType}
                </span>
              </div>
              
              <div className="mt-1 flex items-center gap-2">
                {nft.isListed ? (
                   <span className="text-xs font-serif font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                     {formatSuiPrice(nft.price)} SUI
                   </span>
                ) : (
                   <span className="text-xs font-serif text-gray-400 italic">Not Listed</span>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col gap-2 mt-3">
              <div className="flex gap-2">
                <RetroButton
                  size="sm"
                  className="!px-3 justify-center text-[10px] min-w-[60px]"
                  variant={isVisible ? 'secondary' : 'primary'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleVisibility();
                  }}
                >
                  {isVisible ? 'Hide' : 'Show'}
                </RetroButton>

                <RetroButton
                  size="sm"
                  className="flex-1 justify-center text-[10px]"
                  variant={isSelected ? 'primary' : 'secondary'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect();
                  }}
                >
                  Transform
                </RetroButton>
              </div>

              <RetroButton
                size="sm"
                className="w-full justify-center text-[10px]"
                variant={isListingMode ? 'primary' : 'secondary'}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleListingMode();
                }}
              >
                {nft.isListed ? 'Manage Listing' : 'List for Sale'}
              </RetroButton>
            </div>
          </div>
        </div>

        {/* Transform Drawer */}
        {isSelected && (
          <div className="px-3 pb-3 pt-0 border-t border-gray-200/50 bg-gray-50/50">
            {isVisible ? (
              <div className="space-y-4 mt-3">
                <div className="grid grid-cols-1">
                   <TransformInput 
                        label="Scale" 
                        value={scale} 
                        onChange={handleScaleChange} 
                        min={0.1} 
                        max={5} 
                        step={0.1} 
                    />
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 mb-1.5 font-serif uppercase">
                        Position
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <TransformInput label="X" value={effectiveTransform.position[0]} onChange={(v) => handlePositionChange(0, v)} min={-10} max={10} />
                        <TransformInput label="Y" value={effectiveTransform.position[1]} onChange={(v) => handlePositionChange(1, v)} min={-5} max={15} />
                        <TransformInput label="Z" value={effectiveTransform.position[2]} onChange={(v) => handlePositionChange(2, v)} min={-10} max={10} />
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-gray-500 mb-1.5 font-serif uppercase">
                        Rotation
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <TransformInput label="X" value={effectiveTransform.rotation[0]} onChange={(v) => handleRotationChange(0, v)} min={-3.14} max={3.14} step={0.01} />
                        <TransformInput label="Y" value={effectiveTransform.rotation[1]} onChange={(v) => handleRotationChange(1, v)} min={-3.14} max={3.14} step={0.01} />
                        <TransformInput label="Z" value={effectiveTransform.rotation[2]} onChange={(v) => handleRotationChange(2, v)} min={-3.14} max={3.14} step={0.01} />
                      </div>
                    </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                 <div className="text-2xl mb-2 opacity-30">👻</div>
                <p className="text-xs text-gray-500 mb-2 font-serif italic">Object is hidden. Enable visibility to edit.</p>
                <RetroButton size="sm" onClick={onToggleVisibility}>Show Object</RetroButton>
              </div>
            )}
          </div>
        )}

        {/* Listing/Management Drawer */}
        {isListingMode && (
          <div className="px-3 pb-3 pt-0 border-t border-gray-200/50 bg-gray-50/50">
            {nft.isListed ? (
              // Delist UI
              <div className="py-3 space-y-3">
                 <div className="text-[10px] font-bold text-gray-500 font-serif uppercase tracking-wider">
                    Listing Management
                 </div>
                 <div className="bg-white/50 p-2 rounded border border-gray-200 text-sm font-serif text-gray-700">
                    Listed for <span className="font-bold">{formatSuiPrice(nft.price)} SUI</span>
                 </div>
                 <div className="flex gap-2">
                   <RetroButton 
                      className="flex-1 justify-center hover:bg-gray-100 text-gray-800"
                      onClick={async () => {
                         if(isProcessing) return;
                         setIsProcessing(true);
                         try {
                           await onDelist();
                         } catch(e: any) {
                           console.error(e);
                           alert(e.message);
                         } finally {
                           setIsProcessing(false);
                         }
                      }}
                      disabled={isProcessing}
                   >
                     {isProcessing ? 'Processing...' : 'Delist Item'}
                   </RetroButton>
                   <RetroButton 
                      className="flex-1 justify-center"
                      onClick={onToggleListingMode}
                      disabled={isProcessing}
                   >
                     Close
                   </RetroButton>
                 </div>
              </div>
            ) : (
              // List UI
              <div className="py-3 space-y-3">
                <div className="text-[10px] font-bold text-gray-500 font-serif uppercase tracking-wider">
                  Set Listing Price
                </div>
                <div className="flex items-center gap-2">
                  <RetroPanel variant="inset" className="p-0 flex-1">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={listPrice}
                      onChange={(e) => setListPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-transparent border-0 outline-none text-sm font-serif text-gray-900"
                      placeholder="1.0"
                    />
                  </RetroPanel>
                  <span className="text-sm text-gray-600 font-serif whitespace-nowrap">SUI</span>
                </div>
                <div className="flex gap-2">
                  <RetroButton
                    size="sm"
                    variant="primary"
                    onClick={async () => {
                      const price = parseFloat(listPrice);
                      if (price > 0 && !isProcessing) {
                        setIsProcessing(true);
                        try {
                          await onList(price);
                          onToggleListingMode();
                        } catch (error: any) {
                          console.error('❌ List failed:', error);
                          alert(`Failed to list NFT: ${error.message || 'Unknown error'}`);
                        } finally {
                          setIsProcessing(false);
                        }
                      }
                    }}
                    className="flex-1 justify-center"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Listing...' : 'List for Sale'}
                  </RetroButton>
                  <RetroButton
                    size="sm"
                    variant="secondary"
                    onClick={onToggleListingMode}
                    className="flex-1 justify-center"
                    disabled={isProcessing}
                  >
                    Cancel
                  </RetroButton>
                </div>
              </div>
            )}
          </div>
        )}
      </RetroPanel>
    </div>
  );
}

export function NFTListPanel({
  kioskId,
  visibleNFTs,
  objectTransforms,
  selectedNFTId,
  onToggleVisibility,
  onScaleChange,
  onTransformChange,
  onSelect,
  onEditTransform,
  onList,
  onDelist,
}: NFTListPanelProps) {
  const { nfts, loading, error, refetch } = useKioskManagement({
    kioskId,
    enabled: !!kioskId,
  });
  
  const [listingModeNFTId, setListingModeNFTId] = useState<string | null>(null);

  if (!kioskId) return <div className="p-4 text-center text-xs text-gray-500">No Kiosk ID</div>;
  if (loading) return <div className="p-8 text-center text-gray-400 animate-pulse">Loading NFTs...</div>;
  if (error) return <div className="p-4 text-center text-red-500 text-xs">{error.message}</div>;

  return (
    <div className="space-y-1">
        {nfts.length === 0 ? (
          <div className="text-center py-12">
          <div className="text-3xl mb-2 opacity-50">📦</div>
          <p className="text-sm text-gray-500 font-serif">No NFTs found</p>
          </div>
        ) : (
          nfts.map(nft => (
            <NFTItem
              key={nft.id}
              nft={nft}
              isVisible={visibleNFTs.has(nft.id)}
              isSelected={selectedNFTId === nft.id}
              isListingMode={listingModeNFTId === nft.id}
              transform={objectTransforms.get(nft.id)}
              onToggleVisibility={() => onToggleVisibility(nft.id)}
              onScaleChange={(scale) => onScaleChange(nft.id, scale)}
              onTransformChange={onTransformChange ? (t) => onTransformChange(nft.id, t) : undefined}
              onSelect={() => {
                if (onSelect) onSelect(nft.id);
                else if (onEditTransform) onEditTransform(nft.id);
              }}
              onList={async (price) => {
                if (!onList || typeof onList !== 'function') {
                  throw new Error('onList prop is not a function');
                }
                await onList(nft.id, price);
                // Refresh NFT list after successful listing
                await refetch();
              }}
              onDelist={async () => {
                await onDelist(nft.id);
                // Refresh NFT list after successful delisting
                await refetch();
              }}
              onToggleListingMode={() => setListingModeNFTId(listingModeNFTId === nft.id ? null : nft.id)}
            />
          ))
        )}
    </div>
  );
}
