import { test } from "node:test";
import assert from "node:assert/strict";
import { CreateNode } from "../../../domain/operations/CreateNode.js";
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

test("CreateNode creates a node with a generated id", () => {
  const graph = createGraph();

  const result = CreateNode.execute(graph, {
    position: { x: 1, y: 2, z: 3 },
    label: "Node",
  });

  assert.equal(result.ok, true);
  assert.equal(typeof result.value.id, "string");
  assert.ok(result.value.id.length > 0);
  assert.deepEqual(result.value.position, { x: 1, y: 2, z: 3 });
  assert.equal(graph.getAllNodes().length, 1);
  assert.deepEqual(graph.getNode(result.value.id).position, {
    x: 1,
    y: 2,
    z: 3,
  });
});

test("CreateNode rejects missing position", () => {
  const graph = createGraph();

  const result = CreateNode.execute(graph, {});

  assert.equal(result.ok, false);
  assert.equal(result.reason, "InvalidNodeInput");
  assert.equal(graph.getAllNodes().length, 0);
});

test("CreateNode rejects malformed position", () => {
  const graph = createGraph();

  const result = CreateNode.execute(graph, {
    position: { x: 1, y: 2 },
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, "InvalidNodeInput");
  assert.equal(graph.getAllNodes().length, 0);
});
