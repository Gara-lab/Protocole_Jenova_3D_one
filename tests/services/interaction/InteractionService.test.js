import { test } from "node:test";
import assert from "node:assert/strict";
import { InteractionService } from "../../../services/interaction/InteractionService.js";
import { RendererService } from "../../../services/renderer/RendererService.js";
import { EventBus } from "../../../core/events.js";

function resetInteraction() {
  InteractionService.initialized = false;
  InteractionService.canvas = null;
  InteractionService.camera = null;
  InteractionService.controls = null;
  InteractionService.attachedNodeId = null;
}

function patchVisualObject(value) {
  const original = RendererService.getVisualObject;

  RendererService.getVisualObject = () => value;

  return () => {
    RendererService.getVisualObject = original;
  };
}

test("InteractionService rejects calls before initialization", () => {
  resetInteraction();

  assert.equal(InteractionService.attachToNode("n1").reason, "NotInitialized");
  assert.equal(InteractionService.detach().reason, "NotInitialized");
});

test("InteractionService attachToNode fails when visual is missing", () => {
  resetInteraction();

  InteractionService.initialized = true;
  InteractionService.controls = {
    detach() {},
    attach() {},
  };

  const restore = patchVisualObject(null);

  const result = InteractionService.attachToNode("missing");

  restore();

  assert.equal(result.ok, false);
  assert.equal(result.reason, "NodeVisualNotFound");
});

test("InteractionService attachToNode attaches to the resolved visual", () => {
  resetInteraction();

  const added = [];
  const scene = {
    isScene: true,
    add(object) {
      added.push(object);
    },
  };

  const visual = {
    parent: scene,
  };

  let attached = null;

  InteractionService.initialized = true;
  InteractionService.controls = {
    parent: null,
    detach() {},
    attach(object) {
      attached = object;
    },
  };

  const restore = patchVisualObject(visual);

  const result = InteractionService.attachToNode("n1");

  restore();

  assert.equal(result.ok, true);
  assert.equal(attached, visual);
  assert.equal(added.length, 1);
  assert.equal(added[0], InteractionService.controls);
});

test("InteractionService emits NodeDragCommitted on drag end", () => {
  resetInteraction();

  let emitted = null;

  const unsubscribe = EventBus.on("NodeDragCommitted", (payload) => {
    emitted = payload;
  });

  InteractionService.initialized = true;
  InteractionService.attachedNodeId = "n1";
  InteractionService.controls = {
    object: {
      position: { x: 1, y: 2, z: 3 },
    },
  };

  InteractionService.onDraggingChanged({ value: false });

  unsubscribe();

  assert.deepEqual(emitted, {
    nodeId: "n1",
    position: { x: 1, y: 2, z: 3 },
  });
});

test("InteractionService detach clears attachment", () => {
  resetInteraction();

  let detached = false;

  InteractionService.initialized = true;
  InteractionService.attachedNodeId = "n1";
  InteractionService.controls = {
    detach() {
      detached = true;
    },
  };

  const result = InteractionService.detach();

  assert.equal(result.ok, true);
  assert.equal(detached, true);
  assert.equal(InteractionService.attachedNodeId, null);
});
