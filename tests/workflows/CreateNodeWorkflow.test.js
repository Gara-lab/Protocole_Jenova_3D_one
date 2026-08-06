import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraph } from "../../domain/graph/Graph.js";
import { CreateNodeWorkflow } from "../../workflows/CreateNodeWorkflow.js";
import { RendererService } from "../../services/renderer/RendererService.js";

function patch(target, methodName, implementation) {
  const original = target[methodName];
  target[methodName] = implementation;

  return () => {
    target[methodName] = original;
  };
}

test("CreateNodeWorkflow creates node and syncs visual", () => {
  const graph = createGraph();

  const restore = patch(RendererService, "addNodeVisual", () => {
    return { ok: true, value: null };
  });

  const result = CreateNodeWorkflow.execute(graph, {
    position: { x: 1, y: 2, z: 3 },
  });

  restore();

  assert.equal(result.ok, true);
  assert.equal(graph.getAllNodes().length, 1);
  assert.deepEqual(graph.getNode(result.value.id).position, {
    x: 1,
    y: 2,
    z: 3,
  });
});

test("CreateNodeWorkflow rolls back when visual sync fails", () => {
  const graph = createGraph();

  const restore = patch(RendererService, "addNodeVisual", () => {
    return { ok: false, reason: "NotInitialized" };
  });

  const result = CreateNodeWorkflow.execute(graph, {
    position: { x: 0, y: 0, z: 0 },
  });

  restore();

  assert.equal(result.ok, false);
  assert.equal(result.reason, "SyncFailedRolledBack");
  assert.equal(graph.getAllNodes().length, 0);
});
