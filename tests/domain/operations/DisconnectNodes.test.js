import { test } from "node:test";
import assert from "node:assert/strict";
import { DisconnectNodes } from "../../../domain/operations/DisconnectNodes.js";
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

test("DisconnectNodes removes an existing link", () => {
  const graph = createGraph();

  addNode(graph, makeNode("node-1"));
  addNode(graph, makeNode("node-2"));

  addLink(graph, makeLink("link-1", "node-1", "node-2"));

  const result = DisconnectNodes.execute(graph, "link-1");

  assert.equal(result.ok, true);
  assert.equal(result.value.removedLinkId, "link-1");
  assert.equal(graph.hasLink("link-1"), false);
});

test("DisconnectNodes rejects missing links", () => {
  const graph = createGraph();

  const result = DisconnectNodes.execute(graph, "missing");

  assert.equal(result.ok, false);
  assert.equal(result.reason, "LinkNotFound");
});
