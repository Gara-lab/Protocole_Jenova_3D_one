import { TransformControls } from "three/addons/controls/TransformControls.js";
import { RendererService } from "../renderer/RendererService.js";
import { EventBus } from "../../core/events/EventBus.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

class InteractionServiceImplementation {
  initialized = false;
  canvas = null;
  camera = null;
  controls = null;
  attachedNodeId = null;

  onDraggingChanged = (event) => {
    if (!this.initialized || !this.controls) {
      return;
    }

    if (event.value !== false) {
      return;
    }

    if (!this.attachedNodeId || !this.controls.object) {
      return;
    }

    const position = this.controls.object.position;

    EventBus.emit("NodeDragCommitted", {
      nodeId: this.attachedNodeId,
      position: {
        x: position.x,
        y: position.y,
        z: position.z,
      },
    });
  };

  initialize(canvasElement, cameraInstance) {
    if (this.initialized) {
      return ok(null);
    }

    if (!canvasElement || !cameraInstance) {
      return fail("InitializationFailed");
    }

    try {
      const controls = new TransformControls(cameraInstance, canvasElement);

      controls.setMode("translate");
      controls.enabled = true;
      controls.addEventListener("dragging-changed", this.onDraggingChanged);

      this.canvas = canvasElement;
      this.camera = cameraInstance;
      this.controls = controls;
      this.initialized = true;

      return ok(null);
    } catch {
      return fail("InitializationFailed");
    }
  }

  dispose() {
    if (this.controls) {
      this.controls.removeEventListener(
        "dragging-changed",
        this.onDraggingChanged
      );

      this.controls.detach();

      const helper = this.controls.getHelper();

      if (helper && helper.parent) {
        helper.parent.remove(helper);
    }

      this.controls.dispose();
    }

    this.canvas = null;
    this.camera = null;
    this.controls = null;
    this.attachedNodeId = null;
    this.initialized = false;
  }

  attachToNode(nodeId) {
    if (!this.initialized || !this.controls) {
      return fail("NotInitialized");
    }

    const visual = RendererService.getVisualObject(nodeId);

    if (!visual) {
      return fail("NodeVisualNotFound");
    }

    this.controls.detach();
    this.controls.attach(visual);

    this.attachedNodeId = nodeId;

    const scene = this.findScene(visual);

    const helper = this.controls.getHelper();

    if (scene && helper && helper.parent !== scene) {
      scene.add(helper);
    }
    return ok(null);
  }

  detach() {
    if (!this.initialized || !this.controls) {
      return fail("NotInitialized");
    }

    this.controls.detach();
    this.attachedNodeId = null;

    return ok(null);
  }

  findScene(object) {
    let current = object;

    while (current) {
      if (current.isScene) {
        return current;
      }

      current = current.parent;
    }

    return null;
  }
}

export const InteractionService = new InteractionServiceImplementation();
