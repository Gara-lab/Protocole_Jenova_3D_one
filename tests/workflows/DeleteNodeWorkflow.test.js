import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraph } from "../../domain/graph/Graph.js";
import { DeleteNodeWorkflow } from "../../workflows/DeleteNodeWorkflow.js";
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

test("DeleteNodeWorkflow deletes domain state and reports sync failures", () => {
  const graph = createGraph();

  graph.addNode(makeNode("n1"));
  graph.addNode(makeNode("n2"));
  graph.addNode(makeNode("n3"));

  graph.addLink(makeLink("l1", "n1", "n2"));
  graph.addLink(makeLink("l2", "n1", "n3"));

  const removedLinkVisualCalls = [];

  const restoreNodeVisual = patch(RendererService, "removeNodeVisual", () => {
    return { ok: true, value: null };
  });

  const restoreLinkVisual = patch(
    RendererService,
    "removeLinkVisual",
    (linkId) => {
      removedLinkVisualCalls.push(linkId);

      if (linkId === "l1") {
        return { ok: false, reason: "LinkVisualNotFound" };
      }

      return { ok: true, value: null };
    }
  );

  const result = DeleteNodeWorkflow.execute(graph, "n1");

  restoreNodeVisual();
  restoreLinkVisual();

  assert.equal(result.ok, false);
  assert.equal(result.reason, "SyncFailed");
  assert.deepEqual(result.value.failedVisualIds, ["l1"]);
  assert.deepEqual(removedLinkVisualCalls.sort(), ["l1", "l2"]);
  assert.equal(graph.hasNode("n1"), false);
  assert.equal(graph.hasLink("l1"), false);
  assert.equal(graph.hasLink("l2"), false);
});
