import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraph } from "../../domain/graph/Graph.js";
import { ConnectNodesWorkflow } from "../../workflows/ConnectNodesWorkflow.js";
import { RendererService } from "../../services/renderer/RendererService.js";

function patch(target, methodName, implementation) {
  const original = target[methodName];
  target[methodName] = implementation;

  return () => {
    target[methodName] = original;
  };
}

function makeNode(id) {
  return {
    id,
    position: { x: 0, y: 0, z: 0 },
    label: id,
  };
}

test("ConnectNodesWorkflow creates link and syncs visual", () => {
  const graph = createGraph();

  graph.addNode(makeNode("n1"));
  graph.addNode(makeNode("n2"));

  const restore = patch(RendererService, "addLinkVisual", () => {
    return { ok: true, value: null };
  });

  const result = ConnectNodesWorkflow.execute(graph, "n1", "n2");

  restore();

  assert.equal(result.ok, true);
  assert.equal(graph.getAllLinks().length, 1);
  assert.equal(result.value.sourceId, graph.getAllNodes()[0].id);
  assert.equal(result.value.targetId, graph.getAllNodes()[1].id);
});

test("ConnectNodesWorkflow rolls back when visual sync fails", () => {
  const graph = createGraph();

  graph.addNode(makeNode("n1"));
  graph.addNode(makeNode("n2"));

  const restore = patch(RendererService, "addLinkVisual", () => {
    return { ok: false, reason: "NotInitialized" };
  });

  const result = ConnectNodesWorkflow.execute(graph, "n1", "n2");

  restore();

  assert.equal(result.ok, false);
  assert.equal(result.reason, "SyncFailedRolledBack");
  assert.equal(graph.getAllLinks().length, 0);
});
