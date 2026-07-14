/**
 * LAYER MANAGER
 * ==============
 * Business logic for listing, labeling, selecting, and reordering
 * canvas "layers" (Fabric objects). Deliberately kept separate from
 * the LayerPanel UI component so the panel stays a thin presentation
 * layer — matches the same separation pattern used by HistoryManager.
 *
 * Note: unlike HistoryManager, this module is intentionally NOT fully
 * canvas-agnostic — layers are inherently tied to a live Fabric canvas
 * instance (you can't "snapshot" a layer list the way you can a JSON
 * history state). It uses loose `any` typing for Fabric objects,
 * consistent with the rest of the codebase's `FabricCanvas = any`
 * convention (Fabric ships no bundled TypeScript types).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricObject = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FabricCanvas = any;

export interface LayerInfo {
  object: FabricObject;
  label: string;
  icon: string;
}

function labelForObject(obj: FabricObject, positionFromTop: number): LayerInfo {
  switch (obj.type) {
    case "textbox":
    case "text":
      return {
        object: obj,
        icon: "✍️",
        label: obj.text ? String(obj.text).slice(0, 22) : "Text",
      };
    case "image":
      return { object: obj, icon: "🖼️", label: "Image" };
    case "rect":
      return { object: obj, icon: "▭", label: "Rectangle" };
    case "circle":
      return { object: obj, icon: "⬤", label: "Circle" };
    default:
      return { object: obj, icon: "🔷", label: `Layer ${positionFromTop + 1}` };
  }
}

/** Returns layers in visual top-to-bottom order (topmost/front-most first). */
export function getLayers(canvas: FabricCanvas): LayerInfo[] {
  if (!canvas) return [];
  const objects: FabricObject[] = canvas.getObjects();
  return [...objects]
    .reverse()
    .map((obj, i) => labelForObject(obj, i));
}

export function selectLayer(canvas: FabricCanvas, obj: FabricObject): void {
  if (!canvas) return;
  canvas.setActiveObject(obj);
  canvas.requestRenderAll ? canvas.requestRenderAll() : canvas.renderAll();
}

/** Moves a layer one step forward (visually up the list, in front). */
export function moveLayerUp(canvas: FabricCanvas, obj: FabricObject): void {
  if (!canvas) return;
  const objects: FabricObject[] = canvas.getObjects();
  const index = objects.indexOf(obj);
  if (index >= 0 && index < objects.length - 1) {
    canvas.moveTo(obj, index + 1);
    canvas.renderAll();
  }
}

/** Moves a layer one step backward (visually down the list, behind). */
export function moveLayerDown(canvas: FabricCanvas, obj: FabricObject): void {
  if (!canvas) return;
  const objects: FabricObject[] = canvas.getObjects();
  const index = objects.indexOf(obj);
  if (index > 0) {
    canvas.moveTo(obj, index - 1);
    canvas.renderAll();
  }
}
