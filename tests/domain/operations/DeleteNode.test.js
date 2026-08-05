import { test } from "node:test";
import assert from "node:assert/strict";
import { DeleteNode } from "../../../domain/operations/DeleteNode.js";
import * as GraphModule from "../../../domain/graph/Graph.js";

function createGraph() {
  const module = GraphModule.default ?? GraphModule;

  if (typeof module.createGraph === "function") {
    return module.createGraph();
  }

  if (typeof module.Graph === "function") {
    return new module.Graph();
  }

  if (typeof module === "function") {
    return new module();
  }

  throw new Error("Graph module does not expose createGraph or Graph");
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

function addNode(graph, node) {
  const result = graph.addNode(node);

  if (result && result.ok === false) {
    throw new Error(result.reason);
  }
}

function addLink(graph, link) {
  const result = graph.addLink(link);

  if (result && result.ok === false) {
    throw new Error(result.reason);
  }
}

test("DeleteNode removes the node and cascade-removes attached links", () => {
  const graph = createGraph();

  addNode(graph, makeNode("node-1"));
  addNode(graph, makeNode("node-2"));
  addNode(graph, makeNode("node-3"));

  addLink(graph, makeLink("link-1", "node-1", "node-2"));
  addLink(graph, makeLink("link-2", "node-1", "node-3"));

  const result = DeleteNode.execute(graph, "node-1");

  assert.equal(result.ok, true);
  assert.equal(result.value.removedNodeId, "node-1");
  assert.deepEqual(result.value.removedLinkIds.sort(), [
    "link-1",
    "link-2",
  ]);

  assert.equal(graph.hasNode("node-1"), false);
  assert.equal(graph.hasNode("node-2"), true);
  assert.equal(graph.hasNode("node-3"), true);
  assert.equal(graph.hasLink("link-1"), false);
  assert.equal(graph.hasLink("link-2"), false);
});

test("DeleteNode rejects missing nodes", () => {
  const graph = createGraph();

  addNode(graph, makeNode("node-1"));

  const result = DeleteNode.execute(graph, "missing");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "NodeNotFound");
  assert.equal(graph.getAllNodes().length, 1);
});
