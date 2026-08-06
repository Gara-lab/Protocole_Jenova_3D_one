import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraph } from "../../domain/graph/Graph.js";
import { DisconnectNodesWorkflow } from "../../workflows/DisconnectNodesWorkflow.js";
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

function makeLink(id, sourceId, targetId) {
  return {
    id,
    sourceId,
    targetId,
  };
}

test("DisconnectNodesWorkflow removes link when sync succeeds", () => {
  const graph = createGraph();

  graph.addNode(makeNode("n1"));
  graph.addNode(makeNode("n2"));
  graph.addLink(makeLink("l1", "n1", "n2"));

  const restore = patch(RendererService, "removeLinkVisual", () => {
    return { ok: true, value: null };
  });

  const result = DisconnectNodesWorkflow.execute(graph, "l1");

  restore();

  assert.equal(result.ok, true);
  assert.equal(graph.hasLink("l1"), false);
});

test("DisconnectNodesWorkflow does not roll back domain when visual sync fails", () => {
  const graph = createGraph();

  graph.addNode(makeNode("n1"));
  graph.addNode(makeNode("n2"));
  graph.addLink(makeLink("l1", "n1", "n2"));

  const restore = patch(RendererService, "removeLinkVisual", () => {
    return { ok: false, reason: "LinkVisualNotFound" };
  });

  const result = DisconnectNodesWorkflow.execute(graph, "l1");

  restore();

  assert.equal(result.ok, false);
  assert.equal(result.reason, "SyncFailed");
  assert.equal(graph.hasLink("l1"), false);
});
