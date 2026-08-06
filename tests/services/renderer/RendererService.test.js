import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { RendererService } from "../../../services/renderer/RendererService.js";

function resetRenderer() {
  RendererService.initialized = false;
  RendererService.canvas = null;
  RendererService.scene = null;
  RendererService.renderer = null;
  RendererService.camera = null;
  RendererService.nodeGeometry = null;
  RendererService.nodeMaterial = null;
  RendererService.linkMaterial = null;
  RendererService.nodeMeshes.clear();
  RendererService.linkLines.clear();
}

test("RendererService rejects calls before initialization", () => {
  resetRenderer();

  assert.equal(RendererService.addNodeVisual({ id: "n1", position: { x: 0, y: 0, z: 0 } }).reason, "NotInitialized");
  assert.equal(RendererService.updateNodeVisual("n1", { x: 0, y: 0, z: 0 }).reason, "NotInitialized");
  assert.equal(RendererService.removeNodeVisual("n1").reason, "NotInitialized");
  assert.equal(RendererService.addLinkVisual({ id: "l1" }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }).reason, "NotInitialized");
  assert.equal(RendererService.removeLinkVisual("l1").reason, "NotInitialized");
  assert.equal(RendererService.renderGraphSnapshot([], []).reason, "NotInitialized");
  assert.equal(RendererService.renderFrame({}).reason, "NotInitialized");
  assert.equal(RendererService.getVisualObject("n1"), null);
  assert.equal(RendererService.pickObjectAt(0, 0), null);
});

test("RendererService initialize fails without a canvas", () => {
  resetRenderer();

  const result = RendererService.initialize(null);

  assert.equal(result.ok, false);
  assert.equal(result.reason, "InitializationFailed");
});

test("RendererService node visual lifecycle", () => {
  resetRenderer();

  const added = [];
  const removed = [];

  RendererService.initialized = true;
  RendererService.scene = {
    add(object) {
      added.push(object);
    },
    remove(object) {
      removed.push(object);
    },
  };
  RendererService.nodeGeometry = new THREE.BoxGeometry(1, 1, 1);
  RendererService.nodeMaterial = new THREE.MeshBasicMaterial();

  const addResult = RendererService.addNodeVisual({
    id: "n1",
    position: { x: 1, y: 2, z: 3 },
  });

  assert.equal(addResult.ok, true);

  const visual = RendererService.getVisualObject("n1");

  assert.ok(visual);
  assert.equal(visual.position.x, 1);
  assert.equal(visual.position.y, 2);
  assert.equal(visual.position.z, 3);

  const updateResult = RendererService.updateNodeVisual("n1", {
    x: 4,
    y: 5,
    z: 6,
  });

  assert.equal(updateResult.ok, true);
  assert.equal(visual.position.x, 4);
  assert.equal(visual.position.y, 5);
  assert.equal(visual.position.z, 6);

  const removeResult = RendererService.removeNodeVisual("n1");

  assert.equal(removeResult.ok, true);
  assert.equal(RendererService.getVisualObject("n1"), null);
  assert.equal(removed.length, 1);

  RendererService.nodeGeometry.dispose();
  RendererService.nodeMaterial.dispose();
});

test("RendererService link visual lifecycle", () => {
  resetRenderer();

  const added = [];
  const removed = [];

  RendererService.initialized = true;
  RendererService.scene = {
    add(object) {
      added.push(object);
    },
    remove(object) {
      removed.push(object);
    },
  };
  RendererService.linkMaterial = new THREE.LineBasicMaterial();

  const addResult = RendererService.addLinkVisual(
    { id: "l1" },
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 1, z: 1 }
  );

  assert.equal(addResult.ok, true);
  assert.equal(added.length, 1);

  const removeResult = RendererService.removeLinkVisual("l1");

  assert.equal(removeResult.ok, true);
  assert.equal(removed.length, 1);

  RendererService.linkMaterial.dispose();
});

test("RendererService getVisualObject returns null for unknown id", () => {
  resetRenderer();

  RendererService.initialized = true;

  assert.equal(RendererService.getVisualObject("missing"), null);
});

test("RendererService pickObjectAt returns null when not initialized", () => {
  resetRenderer();

  assert.equal(RendererService.pickObjectAt(10, 10), null);
});
