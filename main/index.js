import { createGraph } from "../domain/graph/Graph.js";
import { RendererService } from "../services/renderer/RendererService.js";
import { CameraService } from "../services/camera/CameraService.js";
import { InteractionService } from "../services/interaction/InteractionService.js";
import { MoveNodeWorkflow } from "../workflows/MoveNodeWorkflow.js";
import { UIPanels } from "../ui/UIPanels.js";
import { UIBindings } from "../ui/UIBindings.js";
import { EventBus } from "../core/events/EventBus.js";

let frameHandle = 0;

function compositionError(reason) {
  return new Error(`CompositionFailed: ${reason}`);
}

function ensureOk(result, step) {
  if (!result || result.ok !== true) {
    throw compositionError(result?.reason ?? step);
  }

  return result.value;
}

function subscribeEvents(graph) {
  const handleNodeDragCommitted = (payload) => {
    if (!payload || !payload.nodeId || !payload.position) {
      return;
    }

    MoveNodeWorkflow.execute(graph, payload.nodeId, payload.position);
  };

  if (typeof EventBus.on === "function") {
    EventBus.on("NodeDragCommitted", handleNodeDragCommitted);
    return;
  }

  if (typeof EventBus.subscribe === "function") {
    EventBus.subscribe("NodeDragCommitted", handleNodeDragCommitted);
    return;
  }

  throw compositionError("EventBus");
}

function startFrameLoop() {
  if (typeof requestAnimationFrame !== "function") {
    throw compositionError("requestAnimationFrame");
  }

  const frame = () => {
    try {
      const updateResult = CameraService.update();

      if (updateResult.ok) {
        const cameraStateResult = CameraService.getCameraState();

        if (cameraStateResult.ok) {
          RendererService.renderFrame(cameraStateResult.value);
        }
      }
    } catch (error) {
      console.error(error);
    }

    frameHandle = requestAnimationFrame(frame);
  };

  frameHandle = requestAnimationFrame(frame);
}

function start() {
  const rootElement = document.getElementById("app-root");

    if (!rootElement) {
      throw compositionError("RootElement");
}

  const graph = createGraph();

  ensureOk(UIPanels.initialize(rootElement), "UIPanels");

  const canvasElement = UIPanels.getCanvasElement();
  const controlElements = UIPanels.getControlElements();

  if (!canvasElement || !controlElements) {
    throw compositionError("UIPanels");
  }

  ensureOk(
    RendererService.initialize(canvasElement),
    "RendererService"
  );

  const initialCameraConfig = {
    position: { x: 0, y: 0, z: 10 },
    target: { x: 0, y: 0, z: 0 },
  };

  ensureOk(
    CameraService.initialize(canvasElement, initialCameraConfig),
    "CameraService"
  );

  const cameraInstanceResult = CameraService.getCameraInstance();
  const cameraInstance = ensureOk(
    cameraInstanceResult,
    "CameraService.getCameraInstance"
  );

  ensureOk(
    InteractionService.initialize(canvasElement, cameraInstance),
    "InteractionService"
  );

  ensureOk(
    UIBindings.initialize(controlElements, canvasElement, graph),
    "UIBindings"
  );

  subscribeEvents(graph);
  startFrameLoop();
}

function boot() {
  try {
    start();
  } catch (error) {
    console.error(error);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
