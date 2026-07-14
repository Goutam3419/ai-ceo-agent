"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useRangoliAuth } from "@/lib/rangoli-auth-context";
import { HistoryManager } from "@/lib/rangoli-history-manager";
import { getLayers, selectLayer, moveLayerUp, moveLayerDown } from "@/lib/rangoli-layer-manager";
import LayerPanel from "@/components/rangoli/LayerPanel";
import { RANGOLI_TEMPLATES } from "@/lib/rangoli-templates";
import { RANGOLI_CATEGORIES } from "@/lib/rangoli-categories";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;

const BG_SWATCHES = ["#FFFFFF", "#2B1B2E", "#D6336C", "#1877F2", "#FCE4EC", "#1A1A1A"];

export default function RangoliEditor() {
  const { user, loading } = useRangoliAuth();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [selection, setSelection] = useState<FabricCanvas | null>(null);
  const historyRef = useRef(new HistoryManager<object>(50));
  const isRestoringRef = useRef(false);
  const [historyState, setHistoryState] = useState({ canUndo: false, canRedo: false });
  const [layersOpen, setLayersOpen] = useState(false);
  const [layersTick, setLayersTick] = useState(0);

  const template = RANGOLI_TEMPLATES.find((t) => t.id === templateId);
  const category = RANGOLI_CATEGORIES.find((c) => c.key === template?.category);

  useEffect(() => {
    if (!loading && !user) router.push("/rangoli/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !template || !category || !canvasElRef.current) return;

    let canvas: FabricCanvas;

    import("fabric").then(({ fabric }) => {
      const containerWidth = containerRef.current?.clientWidth || 360;
      const scale = containerWidth / category.width;

      canvas = new fabric.Canvas(canvasElRef.current, {
        width: category.width * scale,
        height: category.height * scale,
      });

      // Bade touch-friendly control handles taaki mobile pe edit karna easy ho
      fabric.Object.prototype.transparentCorners = false;
      fabric.Object.prototype.cornerSize = 22;
      fabric.Object.prototype.cornerColor = "#D6336C";
      fabric.Object.prototype.borderColor = "#D6336C";
      fabric.Object.prototype.padding = 6;

      canvas.loadFromJSON(template.canvasJSON, () => {
        canvas.setZoom(scale);
        canvas.setWidth(category.width * scale);
        canvas.setHeight(category.height * scale);
        canvas.renderAll();
        // Baseline snapshot — the starting point undo can never go past
        historyRef.current.reset(canvas.toJSON());
        setHistoryState({ canUndo: false, canRedo: false });
      });

      fabricRef.current = canvas;
      setReady(true);

      const syncSelection = () => {
        setSelection(canvas.getActiveObject() || null);
        setLayersTick((t) => t + 1);
      };
      canvas.on("selection:created", syncSelection);
      canvas.on("selection:updated", syncSelection);
      canvas.on("selection:cleared", () => {
        setSelection(null);
        setLayersTick((t) => t + 1);
      });
      canvas.on("object:modified", syncSelection);

      // History capture — any add/modify/remove becomes an undo step,
      // unless we're the ones currently restoring a previous snapshot
      // (isRestoringRef guards against that feedback loop).
      const captureHistory = () => {
        if (isRestoringRef.current) return;
        historyRef.current.push(canvas.toJSON());
        setHistoryState({
          canUndo: historyRef.current.canUndo(),
          canRedo: historyRef.current.canRedo(),
        });
        setLayersTick((t) => t + 1);
      };
      canvas.on("object:added", captureHistory);
      canvas.on("object:modified", captureHistory);
      canvas.on("object:removed", captureHistory);
    });

    return () => {
      canvas?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, template?.id]);

  function undo() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const snapshot = historyRef.current.undo();
    if (!snapshot) return;
    isRestoringRef.current = true;
    canvas.loadFromJSON(snapshot, () => {
      canvas.renderAll();
      isRestoringRef.current = false;
      setHistoryState({
        canUndo: historyRef.current.canUndo(),
        canRedo: historyRef.current.canRedo(),
      });
    });
  }

  function redo() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const snapshot = historyRef.current.redo();
    if (!snapshot) return;
    isRestoringRef.current = true;
    canvas.loadFromJSON(snapshot, () => {
      canvas.renderAll();
      isRestoringRef.current = false;
      setHistoryState({
        canUndo: historyRef.current.canUndo(),
        canRedo: historyRef.current.canRedo(),
      });
    });
  }

  // Keyboard shortcuts: Ctrl/Cmd+Z = undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y = redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        (e.key.toLowerCase() === "z" && e.shiftKey) ||
        e.key.toLowerCase() === "y"
      ) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectLayer(obj: FabricCanvas) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    selectLayer(canvas, obj);
    setSelection(obj);
  }

  function handleMoveLayerUp(obj: FabricCanvas) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    moveLayerUp(canvas, obj);
    setLayersTick((t) => t + 1);
  }

  function handleMoveLayerDown(obj: FabricCanvas) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    moveLayerDown(canvas, obj);
    setLayersTick((t) => t + 1);
  }

  function addText() {
    const canvas = fabricRef.current;
    if (!canvas) return;
    import("fabric").then(({ fabric }) => {
      const text = new fabric.Textbox("Naya Text", {
        left: 40,
        top: 40,
        fontSize: 32,
        fontFamily: "Poppins",
        fill: "#2B1B2E",
      });
      canvas.add(text);
      canvas.setActiveObject(text);
    });
  }

  function addShape(kind: "rect" | "circle") {
    const canvas = fabricRef.current;
    if (!canvas) return;
    import("fabric").then(({ fabric }) => {
      const shape =
        kind === "rect"
          ? new fabric.Rect({ left: 60, top: 60, width: 120, height: 80, fill: "#D6336C" })
          : new fabric.Circle({ left: 60, top: 60, radius: 50, fill: "#1877F2" });
      canvas.add(shape);
      canvas.setActiveObject(shape);
    });
  }

  function setBackground(color: string) {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setBackgroundColor(color, () => {
      canvas.renderAll();
      if (!isRestoringRef.current) {
        historyRef.current.push(canvas.toJSON());
        setHistoryState({
          canUndo: historyRef.current.canUndo(),
          canRedo: historyRef.current.canRedo(),
        });
      }
    });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const canvas = fabricRef.current;
    if (!file || !canvas) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      import("fabric").then(({ fabric }) => {
        fabric.Image.fromURL(evt.target?.result as string, (img: FabricCanvas) => {
          img.scaleToWidth(200);
          canvas.add(img);
          canvas.setActiveObject(img);
        });
      });
    };
    reader.readAsDataURL(file);
  }

  function deleteSelected() {
    const canvas = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (active) {
      canvas.remove(active);
      setSelection(null);
    }
  }

  function duplicateSelected() {
    const canvas = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (!active) return;
    active.clone((cloned: FabricCanvas) => {
      cloned.set({ left: (active.left || 0) + 20, top: (active.top || 0) + 20 });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
      setSelection(cloned);
    });
  }

  function bringForward() {
    const canvas = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (active) {
      canvas.bringForward(active);
      canvas.renderAll();
    }
  }

  function sendBackward() {
    const canvas = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (active) {
      canvas.sendBackwards(active);
      canvas.renderAll();
    }
  }

  function changeFontSize(delta: number) {
    const canvas = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (!active || active.type !== "textbox") return;
    const newSize = Math.max(8, (active.fontSize || 32) + delta);
    active.set({ fontSize: newSize });
    canvas.renderAll();
    setSelection({ ...active });
  }

  function changeFillColor(color: string) {
    const canvas = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (!active) return;
    active.set({ fill: color });
    canvas.renderAll();
    setSelection({ ...active });
  }

  function changeOpacity(value: number) {
    const canvas = fabricRef.current;
    const active = canvas?.getActiveObject();
    if (!active) return;
    active.set({ opacity: value });
    canvas.renderAll();
    setSelection({ ...active });
  }

  function download() {
    const canvas = fabricRef.current;
    if (!canvas || !category) return;
    const scale = 1 / canvas.getZoom();
    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier: scale * (category.width / canvas.getWidth()) * canvas.getZoom(),
    });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${template?.id || "rangoli-design"}.png`;
    link.click();
  }

  const layers = useMemo(
    () => (fabricRef.current ? getLayers(fabricRef.current) : []),
    [layersTick]
  );

  if (loading || !user) return null;

  if (!template || !category) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <p>Template nahi mila. <Link href="/rangoli" className="text-rangoli">Wapas jao</Link></p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-rangoliink/10">
        <Link href="/rangoli" className="text-sm text-rangoliink/60">← Back</Link>
        <p className="font-rangoli font-600 text-sm truncate">{template.title}</p>
        <button
          onClick={download}
          disabled={!ready}
          className="text-sm bg-rangoli text-white px-3 py-1.5 rounded-full font-rangoli font-600 disabled:opacity-40"
        >
          ⬇ Save
        </button>
      </header>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center bg-rangoliink/5 p-4 overflow-auto"
      >
        <canvas ref={canvasElRef} />
      </div>

      {/* Bottom toolbar - mobile friendly, big tap targets */}
      <div className="border-t border-rangoliink/10 bg-white px-3 py-3">
        <div className="flex gap-2 overflow-x-auto mb-2">
          <button onClick={addText} className="shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-rangolisoft text-rangoli">
            <span className="text-lg">✍️</span>
            <span className="text-[10px] font-600">Text</span>
          </button>

          <label className="shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-rangolisoft text-rangoli cursor-pointer">
            <span className="text-lg">🖼️</span>
            <span className="text-[10px] font-600">Image</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>

          <button onClick={() => addShape("rect")} className="shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-rangolisoft text-rangoli">
            <span className="text-lg">▭</span>
            <span className="text-[10px] font-600">Box</span>
          </button>

          <button onClick={() => addShape("circle")} className="shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-rangolisoft text-rangoli">
            <span className="text-lg">⬤</span>
            <span className="text-[10px] font-600">Circle</span>
          </button>

          <button onClick={deleteSelected} className="shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-red-50 text-red-500">
            <span className="text-lg">🗑️</span>
            <span className="text-[10px] font-600">Delete</span>
          </button>

          <button
            onClick={undo}
            disabled={!historyState.canUndo}
            className="shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-rangolisoft text-rangoli disabled:opacity-30"
          >
            <span className="text-lg">↩️</span>
            <span className="text-[10px] font-600">Undo</span>
          </button>

          <button
            onClick={redo}
            disabled={!historyState.canRedo}
            className="shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-rangolisoft text-rangoli disabled:opacity-30"
          >
            <span className="text-lg">↪️</span>
            <span className="text-[10px] font-600">Redo</span>
          </button>

          <button
            onClick={() => setLayersOpen(true)}
            className="shrink-0 flex flex-col items-center gap-1 px-4 py-2 rounded-xl bg-rangolisoft text-rangoli"
          >
            <span className="text-lg">📚</span>
            <span className="text-[10px] font-600">Layers</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-rangoliink/40 shrink-0">BG:</span>
          {BG_SWATCHES.map((c) => (
            <button
              key={c}
              onClick={() => setBackground(c)}
              className="w-7 h-7 rounded-full border border-rangoliink/10 shrink-0"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <LayerPanel
        open={layersOpen}
        onClose={() => setLayersOpen(false)}
        layers={layers}
        activeObject={selection}
        onSelect={handleSelectLayer}
        onMoveUp={handleMoveLayerUp}
        onMoveDown={handleMoveLayerDown}
      />
    </main>
  );
}
