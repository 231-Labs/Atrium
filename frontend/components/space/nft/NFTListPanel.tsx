import { useState, useEffect, useCallback, useRef } from 'react';
import { RetroPanel } from '@/components/common/RetroPanel';
import { RetroButton } from '@/components/common/RetroButton';
import { RetroSlider } from '@/components/common/RetroSlider';
import { useKioskManagement, KioskNFT } from '@/hooks/useKioskManagement';
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
  onList: (nftId: string) => void;
  onDelist: (nftId: string) => void;
}

interface NFTItemProps {
  nft: KioskNFT;
  isVisible: boolean;
  isSelected: boolean;
  transform?: ObjectTransform;
  onToggleVisibility: () => void;
  onScaleChange: (scale: number) => void;
  onTransformChange?: (transform: ObjectTransform) => void;
  onSelect: () => void;
  onList: () => void;
  onDelist: () => void;
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
  // Local state to handle typing without jitter
  const [inputValue, setInputValue] = useState(value.toFixed(2));
  const isEditing = useRef(false);
  
  // Sync local state when prop value changes externally, but only if not editing
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
    <div className="flex flex-col gap-1.5">
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
  transform,
  onToggleVisibility,
  onScaleChange,
  onTransformChange,
  onSelect,
  onList,
  onDelist,
}: NFTItemProps) {
  const effectiveTransform = transform || {
    position: [0, 1, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: 1,
  };
  
  const transformRef = useRef(effectiveTransform);
  transformRef.current = effectiveTransform;
  
  const [scale, setScale] = useState(effectiveTransform?.scale || 1.0);

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

  return (
    <div className="mb-3">
      <RetroPanel 
        variant={isSelected ? "inset" : "outset"}
        className={`transition-all duration-200 ${isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
      >
        <div className="flex items-center p-3 gap-4">
          {/* Thumbnail - Left */}
          <div 
            className="flex-shrink-0 cursor-pointer relative group/thumb"
            onClick={onSelect}
          >
            <RetroPanel variant="inset" className="p-0 w-20 h-20 overflow-hidden bg-white flex items-center justify-center border-2 border-gray-200">
              {nft.imageUrl ? (
                <img src={nft.imageUrl} alt={nft.name} className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110" />
              ) : (
                <div className="text-3xl opacity-30">
                  {nft.objectType === '3d' ? '📦' : '🖼️'}
                </div>
              )}
            </RetroPanel>
          </div>

          {/* Info & Actions - Middle */}
          <div className="flex-1 min-w-0 flex flex-col justify-between h-20 py-0.5">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2 flex-wrap">
                 <h4 
                    className="font-serif font-bold text-gray-900 truncate text-lg leading-tight cursor-pointer hover:text-blue-700"
                    onClick={onSelect}
                 >
                    {nft.name}
                 </h4>
                 <span className="text-[9px] uppercase tracking-wider font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                    {nft.objectType}
                 </span>
                 {nft.isListed && (
                    <span className="text-[9px] uppercase tracking-wider font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                        On Sale
                    </span>
                 )}
              </div>
              
              {/* Edit/Expand Toggle (Right Top) */}
              <div 
                onClick={onSelect}
                className="cursor-pointer group"
              >
                 <span className={`
                    text-[10px] font-serif italic border-b border-gray-400 
                    ${isSelected ? 'text-gray-900 border-gray-900 font-bold' : 'text-gray-500 group-hover:text-gray-800 group-hover:border-gray-600'}
                 `}>
                    Edit
                 </span>
              </div>
            </div>

            {/* Primary Actions Row (Bottom) */}
            <div className="flex items-center justify-end gap-2 mt-auto">
                 <RetroButton
                    size="sm"
                    variant={isVisible ? 'primary' : 'secondary'}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility();
                    }}
                    className="!px-3 !py-1 !text-[10px] min-w-[60px] justify-center"
                 >
                    {isVisible ? 'Show' : 'Hide'}
                 </RetroButton>

                 <RetroButton
                    size="sm"
                    variant={nft.isListed ? 'danger' : 'secondary'}
                    onClick={(e) => {
                        e.stopPropagation();
                        nft.isListed ? onDelist() : onList();
                    }}
                    className="!px-3 !py-1 !text-[10px] min-w-[60px] justify-center"
                 >
                    {nft.isListed ? 'Delist' : 'List'}
                 </RetroButton>
            </div>
          </div>
        </div>

        {/* Expandable Editor */}
        {isSelected && (
          <div className="px-3 pb-3 pt-0 border-t border-gray-200/50 bg-gray-50/50">
            {isVisible ? (
              <div className="space-y-4 mt-3">
                {/* Scale Section */}
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
                    {/* Position Grid */}
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 mb-1.5 font-serif uppercase">
                        Position
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <TransformInput label="X" value={effectiveTransform.position[0]} onChange={(v) => handlePositionChange(0, v)} min={-10} max={10} />
                        <TransformInput label="Y" value={effectiveTransform.position[1]} onChange={(v) => handlePositionChange(1, v)} min={-5} max={15} />
                        <TransformInput label="Z" value={effectiveTransform.position[2]} onChange={(v) => handlePositionChange(2, v)} min={-10} max={10} />
                      </div>
                    </div>

                    {/* Rotation Grid */}
                    <div>
                      <div className="text-[10px] font-bold text-gray-500 mb-1.5 font-serif uppercase">
                        Rotation
                      </div>
                      <div className="grid grid-cols-3 gap-3">
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
              transform={objectTransforms.get(nft.id)}
              onToggleVisibility={() => onToggleVisibility(nft.id)}
              onScaleChange={(scale) => onScaleChange(nft.id, scale)}
              onTransformChange={onTransformChange ? (t) => onTransformChange(nft.id, t) : undefined}
              onSelect={() => {
                if (onSelect) onSelect(nft.id);
                else if (onEditTransform) onEditTransform(nft.id);
              }}
              onList={() => onList(nft.id)}
              onDelist={() => onDelist(nft.id)}
            />
          ))
        )}
    </div>
  );
}
