import { test } from "node:test";
import assert from "node:assert/strict";
import { ConnectNodes } from "../../../domain/operations/ConnectNodes.js";
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

test("ConnectNodes creates a link between two existing nodes", () => {
  const graph = createGraph();

  addNode(graph, makeNode("node-1"));
  addNode(graph, makeNode("node-2"));

  const result = ConnectNodes.execute(graph, "node-1", "node-2");

  assert.equal(result.ok, true);
  assert.equal(typeof result.value.id, "string");
  assert.equal(result.value.sourceId, "node-1");
  assert.equal(result.value.targetId, "node-2");
  assert.equal(graph.getAllLinks().length, 1);
});

test("ConnectNodes rejects invalid endpoints", () => {
  const graph = createGraph();

  addNode(graph, makeNode("node-2"));

  const result = ConnectNodes.execute(graph, "missing", "node-2");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "InvalidLinkEndpoints");
  assert.equal(graph.getAllLinks().length, 0);
});

test("ConnectNodes rejects self links", () => {
  const graph = createGraph();

  addNode(graph, makeNode("node-1"));

  const result = ConnectNodes.execute(graph, "node-1", "node-1");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "SelfLinkNotAllowed");
  assert.equal(graph.getAllLinks().length, 0);
});

test("ConnectNodes rejects duplicate links between the same nodes", () => {
  const graph = createGraph();

  addNode(graph, makeNode("node-1"));
  addNode(graph, makeNode("node-2"));

  const first = ConnectNodes.execute(graph, "node-1", "node-2");
  const second = ConnectNodes.execute(graph, "node-1", "node-2");

  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  assert.equal(second.reason, "DuplicateLinkBetweenNodes");
  assert.equal(graph.getAllLinks().length, 1);
});
