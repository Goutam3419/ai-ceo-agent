"use client";

import type { LayerInfo } from "@/lib/rangoli-layer-manager";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricObject = any;

interface Props {
  open: boolean;
  onClose: () => void;
  layers: LayerInfo[];
  activeObject: FabricObject | null;
  onSelect: (obj: FabricObject) => void;
  onMoveUp: (obj: FabricObject) => void;
  onMoveDown: (obj: FabricObject) => void;
}

export default function LayerPanel({
  open,
  onClose,
  layers,
  activeObject,
  onSelect,
  onMoveUp,
  onMoveDown,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="bg-rangolibg rounded-t-3xl max-h-[60vh] flex flex-col shadow-2xl animate-[fadeIn_0.2s_ease-out]">
        <div className="px-5 py-4 border-b border-rangoliink/10 flex items-center justify-between">
          <p className="font-rangoli font-700 text-base">Layers</p>
          <button onClick={onClose} className="text-rangoliink/40 text-xl leading-none">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto ledger-scroll px-3 py-3 space-y-1.5">
          {layers.length === 0 ? (
            <p className="text-xs text-rangoliink/40 px-2">
              Canvas khaali hai — kuch add karo pehle.
            </p>
          ) : (
            layers.map((layer, i) => {
              const isActive = layer.object === activeObject;
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
                    isActive
                      ? "border-rangoli bg-rangolisoft"
                      : "border-rangoliink/10 bg-white"
                  }`}
                >
                  <button
                    onClick={() => onSelect(layer.object)}
                    className="flex-1 flex items-center gap-2 text-left min-w-0"
                  >
                    <span className="text-base shrink-0">{layer.icon}</span>
                    <span className="text-sm truncate">{layer.label}</span>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onMoveUp(layer.object)}
                      className="w-7 h-7 rounded-lg bg-rangoliink/5 flex items-center justify-center text-xs"
                      aria-label="Move layer up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => onMoveDown(layer.object)}
                      className="w-7 h-7 rounded-lg bg-rangoliink/5 flex items-center justify-center text-xs"
                      aria-label="Move layer down"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
