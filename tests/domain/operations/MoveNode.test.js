import { test } from "node:test";
import assert from "node:assert/strict";
import { MoveNode } from "../../../domain/operations/MoveNode.js";
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

function addNode(graph, node) {
  const result = graph.addNode(node);

  if (result && result.ok === false) {
    throw new Error(result.reason);
  }
}

test("MoveNode updates an existing node position", () => {
  const graph = createGraph();

  addNode(graph, makeNode("node-1"));

  const result = MoveNode.execute(graph, "node-1", {
    x: 5,
    y: 6,
    z: 7,
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.value.position, { x: 5, y: 6, z: 7 });
  assert.deepEqual(graph.getNode("node-1").position, { x: 5, y: 6, z: 7 });
});

test("MoveNode rejects malformed positions", () => {
  const graph = createGraph();

  addNode(graph, makeNode("node-1"));

  const originalPosition = graph.getNode("node-1").position;

  const result = MoveNode.execute(graph, "node-1", {
    x: 1,
    y: 2,
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "InvalidPosition");
  assert.deepEqual(graph.getNode("node-1").position, originalPosition);
});

test("MoveNode rejects missing nodes", () => {
  const graph = createGraph();

  const result = MoveNode.execute(graph, "missing", {
    x: 1,
    y: 2,
    z: 3,
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "NodeNotFound");
});
