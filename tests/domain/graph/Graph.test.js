import { test } from "node:test";
import assert from "node:assert/strict";
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

function failureName(error) {
  if (typeof error === "string") {
    return error;
  }

  if (!error || typeof error !== "object") {
    return "Unknown";
  }

  if (typeof error.reason === "string") {
    return error.reason;
  }

  if (typeof error.code === "string") {
    return error.code;
  }

  if (error.name && error.name !== "Error") {
    return error.name;
  }

  if (typeof error.message === "string") {
    return error.message;
  }

  return "Unknown";
}

function failureOf(fn) {
  try {
    const result = fn();

    if (result && typeof result === "object" && result.ok === false) {
      return result.reason;
    }

    return null;
  } catch (error) {
    return failureName(error);
  }
}

function assertMissingQuery(fn, expectedReason) {
  try {
    const value = fn();

    if (value && typeof value === "object" && value.ok === false) {
      assert.equal(value.reason, expectedReason);
      return;
    }

    assert.ok(value == null);
  } catch (error) {
    assert.equal(failureName(error), expectedReason);
  }
}

test("Graph adds and queries nodes", () => {
  const graph = createGraph();

  graph.addNode(makeNode("node-1"));

  const node = graph.getNode("node-1");

  assert.equal(node.id, "node-1");
  assert.equal(graph.getAllNodes().length, 1);
  assert.equal(graph.hasNode("node-1"), true);
  assert.equal(graph.hasNode("missing"), false);

  assertMissingQuery(() => graph.getNode("missing"), "NodeNotFound");
});

test("Graph adds and queries links", () => {
  const graph = createGraph();

  graph.addNode(makeNode("node-1"));
  graph.addNode(makeNode("node-2"));
  graph.addLink(makeLink("link-1", "node-1", "node-2"));

  const link = graph.getLink("link-1");

  assert.equal(link.id, "link-1");
  assert.equal(graph.getAllLinks().length, 1);
  assert.equal(graph.hasLink("link-1"), true);
  assert.equal(graph.hasLink("missing"), false);

  assertMissingQuery(() => graph.getLink("missing"), "LinkNotFound");
});

test("Graph updates node position", () => {
  const graph = createGraph();

  graph.addNode(makeNode("node-1"));

  graph.updateNodePosition("node-1", { x: 5, y: 6, z: 7 });

  assert.deepEqual(graph.getNode("node-1").position, {
    x: 5,
    y: 6,
    z: 7,
  });

  assert.equal(
    failureOf(() =>
      graph.updateNodePosition("missing", { x: 0, y: 0, z: 0 })
    ),
    "NodeNotFound"
  );
});

test("Graph rejects duplicate node ids", () => {
  const graph = createGraph();

  graph.addNode(makeNode("node-1"));

  assert.equal(
    failureOf(() => graph.addNode(makeNode("node-1"))),
    "DuplicateNodeId"
  );
});

test("Graph removes links", () => {
  const graph = createGraph();

  graph.addNode(makeNode("node-1"));
  graph.addNode(makeNode("node-2"));
  graph.addLink(makeLink("link-1", "node-1", "node-2"));

  graph.removeLink("link-1");

  assert.equal(graph.hasLink("link-1"), false);

  assert.equal(
    failureOf(() => graph.removeLink("missing")),
    "LinkNotFound"
  );
});

test("Graph rejects removing missing nodes", () => {
  const graph = createGraph();

  assert.equal(
    failureOf(() => graph.removeNode("missing")),
    "NodeNotFound"
  );
});

test("Graph rejects duplicate link ids", () => {
  const graph = createGraph();

  graph.addNode(makeNode("node-1"));
  graph.addNode(makeNode("node-2"));
  graph.addNode(makeNode("node-3"));

  graph.addLink(makeLink("link-1", "node-1", "node-2"));

  assert.equal(
    failureOf(() => graph.addLink(makeLink("link-1", "node-1", "node-3"))),
    "DuplicateLinkId"
  );
});

test("Graph rejects links with invalid endpoints", () => {
  const graph = createGraph();

  graph.addNode(makeNode("node-2"));

  assert.equal(
    failureOf(() => graph.addLink(makeLink("link-1", "missing", "node-2"))),
    "InvalidLinkEndpoints"
  );
});

test("Graph rejects self links", () => {
  const graph = createGraph();

  graph.addNode(makeNode("node-1"));

  assert.equal(
    failureOf(() => graph.addLink(makeLink("link-1", "node-1", "node-1"))),
    "SelfLinkNotAllowed"
  );
});

test("Graph rejects duplicate links between the same nodes", () => {
  const graph = createGraph();

  graph.addNode(makeNode("node-1"));
  graph.addNode(makeNode("node-2"));

  graph.addLink(makeLink("link-1", "node-1", "node-2"));

  assert.equal(
    failureOf(() => graph.addLink(makeLink("link-2", "node-1", "node-2"))),
    "DuplicateLinkBetweenNodes"
  );
});

test("Graph reports links between nodes", () => {
  const graph = createGraph();

  graph.addNode(makeNode("node-1"));
  graph.addNode(makeNode("node-2"));
  graph.addNode(makeNode("node-3"));

  graph.addLink(makeLink("link-1", "node-1", "node-2"));

  assert.equal(graph.hasLinkBetween("node-1", "node-2"), true);
  assert.equal(graph.hasLinkBetween("node-1", "node-3"), false);
});

test("Graph returns links attached to a node", () => {
  const graph = createGraph();

  graph.addNode(makeNode("node-1"));
  graph.addNode(makeNode("node-2"));
  graph.addNode(makeNode("node-3"));

  graph.addLink(makeLink("link-1", "node-1", "node-2"));
  graph.addLink(makeLink("link-2", "node-1", "node-3"));

  const links = graph.getLinksForNode("node-1");

  assert.equal(links.length, 2);
  assert.deepEqual(links.map((link) => link.id).sort(), ["link-1", "link-2"]);
});

test("Graph cascades link removal when removing a node", () => {
  const graph = createGraph();

  graph.addNode(makeNode("node-1"));
  graph.addNode(makeNode("node-2"));
  graph.addNode(makeNode("node-3"));

  graph.addLink(makeLink("link-1", "node-1", "node-2"));
  graph.addLink(makeLink("link-2", "node-1", "node-3"));

  graph.removeNode("node-1");

  assert.equal(graph.hasNode("node-1"), false);
  assert.equal(graph.hasNode("node-2"), true);
  assert.equal(graph.hasNode("node-3"), true);
  assert.equal(graph.hasLink("link-1"), false);
  assert.equal(graph.hasLink("link-2"), false);
});
