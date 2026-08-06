import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraph } from "../../domain/graph/Graph.js";
import { ImportGraphWorkflow } from "../../workflows/ImportGraphWorkflow.js";
import { PersistenceService } from "../../services/persistence/PersistenceService.js";
import { RendererService } from "../../services/renderer/RendererService.js";
import { CreateNode } from "../../domain/operations/CreateNode.js";

function patch(target, methodName, implementation) {
  const original = target[methodName];
  target[methodName] = implementation;

  return () => {
    target[methodName] = original;
  };
}

const validPosition = { x: 0, y: 0, z: 0 };

test("ImportGraphWorkflow rejects invalid JSON without mutating graph", async () => {
  const graph = createGraph();

  graph.addNode({
    id: "existing",
    position: validPosition,
    label: "existing",
  });

  const restore = patch(PersistenceService, "importFromFile", async () => {
    return { ok: true, value: "not-json" };
  });

  const result = await ImportGraphWorkflow.execute(graph, {});

  restore();

  assert.equal(result.ok, false);
  assert.equal(result.reason, "InvalidImportData");
  assert.equal(graph.getAllNodes().length, 1);
});

test("ImportGraphWorkflow rolls back partial node import failure", async () => {
  const graph = createGraph();

  graph.addNode({
    id: "existing",
    position: validPosition,
    label: "existing",
  });

  const importData = {
    nodes: [
      { id: "n1", position: validPosition },
      { id: "n2", position: validPosition },
      { id: "n3", position: validPosition },
    ],
    links: [],
  };

  const restoreImport = patch(
    PersistenceService,
    "importFromFile",
    async () => {
      return { ok: true, value: JSON.stringify(importData) };
    }
  );

  const restoreRender = patch(
    RendererService,
    "renderGraphSnapshot",
    () => {
      return { ok: true, value: null };
    }
  );

  const originalCreate = CreateNode.execute;
  let createCalls = 0;

  CreateNode.execute = function (...args) {
    createCalls += 1;

    if (createCalls === 2) {
      return { ok: false, reason: "InvalidNodeInput" };
    }

    return originalCreate.call(CreateNode, ...args);
  };

  const result = await ImportGraphWorkflow.execute(graph, {});

  CreateNode.execute = originalCreate;
  restoreImport();
  restoreRender();

  assert.equal(result.ok, false);
  assert.equal(result.reason, "ImportFailedRolledBack");
  assert.equal(graph.getAllNodes().length, 0);
});

test("ImportGraphWorkflow keeps domain import when render sync fails", async () => {
  const graph = createGraph();

  const importData = {
    nodes: [
      { id: "a", position: validPosition },
      { id: "b", position: validPosition },
    ],
    links: [{ sourceId: "a", targetId: "b" }],
  };

  const restoreImport = patch(
    PersistenceService,
    "importFromFile",
    async () => {
      return { ok: true, value: JSON.stringify(importData) };
    }
  );

  const restoreRender = patch(
    RendererService,
    "renderGraphSnapshot",
    () => {
      return { ok: false, reason: "NotInitialized" };
    }
  );

  const result = await ImportGraphWorkflow.execute(graph, {});

  restoreImport();
  restoreRender();

  assert.equal(result.ok, false);
  assert.equal(result.reason, "SyncFailed");
  assert.equal(result.value.nodeCount, 2);
  assert.equal(result.value.linkCount, 1);
  assert.equal(graph.getAllNodes().length, 2);
  assert.equal(graph.getAllLinks().length, 1);
});
