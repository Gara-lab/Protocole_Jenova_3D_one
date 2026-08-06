import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraph } from "../../domain/graph/Graph.js";
import { MoveNodeWorkflow } from "../../workflows/MoveNodeWorkflow.js";
import { RendererService } from "../../services/renderer/RendererService.js";

function patch(target, methodName, implementation) {
  const original = target[methodName];
  target[methodName] = implementation;

  return () => {
    target[methodName] = original;
  };
}

test("MoveNodeWorkflow updates node position when sync succeeds", () => {
  const graph = createGraph();

  graph.addNode({
    id: "n1",
    position: { x: 0, y: 0, z: 0 },
    label: "n1",
  });

  const restore = patch(RendererService, "updateNodeVisual", () => {
    return { ok: true, value: null };
  });

  const result = MoveNodeWorkflow.execute(graph, "n1", {
    x: 5,
    y: 6,
    z: 7,
  });

  restore();

  assert.equal(result.ok, true);
  assert.deepEqual(graph.getNode("n1").position, { x: 5, y: 6, z: 7 });
});

test("MoveNodeWorkflow rolls back position when visual sync fails", () => {
  const graph = createGraph();

  graph.addNode({
    id: "n1",
    position: { x: 0, y: 0, z: 0 },
    label: "n1",
  });

  const restore = patch(RendererService, "updateNodeVisual", () => {
    return { ok: false, reason: "NodeVisualNotFound" };
  });

  const result = MoveNodeWorkflow.execute(graph, "n1", {
    x: 5,
    y: 6,
    z: 7,
  });

  restore();

  assert.equal(result.ok, false);
  assert.equal(result.reason, "SyncFailedRolledBack");
  assert.deepEqual(graph.getNode("n1").position, { x: 0, y: 0, z: 0 });
});
