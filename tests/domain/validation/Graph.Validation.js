import { test } from "node:test";
import assert from "node:assert/strict";
import { GraphValidation } from "../../../domain/validation/GraphValidation.js";

function createValidationGraph(nodes = [], links = []) {
  return {
    hasNode(id) {
      return nodes.some((node) => node.id === id);
    },
    hasLink(id) {
      return links.some((link) => link.id === id);
    },
    hasLinkBetween(sourceId, targetId) {
      return links.some(
        (link) => link.sourceId === sourceId && link.targetId === targetId
      );
    },
  };
}

test("canAddNode accepts a new node", () => {
  const graph = createValidationGraph([{ id: "node-1" }]);

  const result = GraphValidation.canAddNode(graph, { id: "node-2" });

  assert.deepEqual(result, { ok: true });
});

test("canAddNode rejects duplicate node ids", () => {
  const graph = createValidationGraph([{ id: "node-1" }]);

  const result = GraphValidation.canAddNode(graph, { id: "node-1" });

  assert.deepEqual(result, {
    ok: false,
    reason: "DuplicateNodeId",
  });
});

test("canRemoveNode accepts an existing node", () => {
  const graph = createValidationGraph([{ id: "node-1" }]);

  const result = GraphValidation.canRemoveNode(graph, "node-1");

  assert.deepEqual(result, { ok: true });
});

test("canRemoveNode rejects missing nodes", () => {
  const graph = createValidationGraph();

  const result = GraphValidation.canRemoveNode(graph, "missing");

  assert.deepEqual(result, {
    ok: false,
    reason: "NodeNotFound",
  });
});

test("canUpdateNodePosition accepts an existing node", () => {
  const graph = createValidationGraph([{ id: "node-1" }]);

  const result = GraphValidation.canUpdateNodePosition(graph, "node-1", {
    x: 1,
    y: 2,
    z: 3,
  });

  assert.deepEqual(result, { ok: true });
});

test("canUpdateNodePosition rejects missing nodes", () => {
  const graph = createValidationGraph();

  const result = GraphValidation.canUpdateNodePosition(graph, "missing", {
    x: 1,
    y: 2,
    z: 3,
  });

  assert.deepEqual(result, {
    ok: false,
    reason: "NodeNotFound",
  });
});

test("canUpdateNodeLabel accepts an existing node", () => {
  const graph = createValidationGraph([{ id: "node-1" }]);

  const result = GraphValidation.canUpdateNodeLabel(graph, "node-1", "Label");

  assert.deepEqual(result, { ok: true });
});

test("canUpdateNodeLabel rejects missing nodes", () => {
  const graph = createValidationGraph();

  const result = GraphValidation.canUpdateNodeLabel(graph, "missing", "Label");

  assert.deepEqual(result, {
    ok: false,
    reason: "NodeNotFound",
  });
});

test("canAddLink accepts a valid link", () => {
  const graph = createValidationGraph(
    [{ id: "node-1" }, { id: "node-2" }],
    []
  );

  const result = GraphValidation.canAddLink(graph, {
    id: "link-1",
    sourceId: "node-1",
    targetId: "node-2",
  });

  assert.deepEqual(result, { ok: true });
});

test("canAddLink rejects duplicate link ids", () => {
  const graph = createValidationGraph(
    [{ id: "node-1" }, { id: "node-2" }],
    [
      {
        id: "link-1",
        sourceId: "node-1",
        targetId: "node-2",
      },
    ]
  );

  const result = GraphValidation.canAddLink(graph, {
    id: "link-1",
    sourceId: "node-1",
    targetId: "node-2",
  });

  assert.deepEqual(result, {
    ok: false,
    reason: "DuplicateLinkId",
  });
});

test("canAddLink rejects invalid endpoints", () => {
  const graph = createValidationGraph([{ id: "node-2" }], []);

  const result = GraphValidation.canAddLink(graph, {
    id: "link-1",
    sourceId: "missing",
    targetId: "node-2",
  });

  assert.deepEqual(result, {
    ok: false,
    reason: "InvalidLinkEndpoints",
  });
});

test("canAddLink rejects self links", () => {
  const graph = createValidationGraph([{ id: "node-1" }], []);

  const result = GraphValidation.canAddLink(graph, {
    id: "link-1",
    sourceId: "node-1",
    targetId: "node-1",
  });

  assert.deepEqual(result, {
    ok: false,
    reason: "SelfLinkNotAllowed",
  });
});

test("canAddLink rejects duplicate links between nodes", () => {
  const graph = createValidationGraph(
    [{ id: "node-1" }, { id: "node-2" }],
    [
      {
        id: "link-1",
        sourceId: "node-1",
        targetId: "node-2",
      },
    ]
  );

  const result = GraphValidation.canAddLink(graph, {
    id: "link-2",
    sourceId: "node-1",
    targetId: "node-2",
  });

  assert.deepEqual(result, {
    ok: false,
    reason: "DuplicateLinkBetweenNodes",
  });
});

test("canRemoveLink accepts an existing link", () => {
  const graph = createValidationGraph(
    [],
    [
      {
        id: "link-1",
        sourceId: "node-1",
        targetId: "node-2",
      },
    ]
  );

  const result = GraphValidation.canRemoveLink(graph, "link-1");

  assert.deepEqual(result, { ok: true });
});

test("canRemoveLink rejects missing links", () => {
  const graph = createValidationGraph();

  const result = GraphValidation.canRemoveLink(graph, "missing");

  assert.deepEqual(result, {
    ok: false,
    reason: "LinkNotFound",
  });
});
