import { test } from "node:test";
import assert from "node:assert/strict";
import { createGraph } from "../../domain/graph/Graph.js";
import { ExportGraphWorkflow } from "../../workflows/ExportGraphWorkflow.js";
import { PersistenceService } from "../../services/persistence/PersistenceService.js";

function patch(target, methodName, implementation) {
  const original = target[methodName];
  target[methodName] = implementation;

  return () => {
    target[methodName] = original;
  };
}

test("ExportGraphWorkflow exports graph without mutating it", () => {
  const graph = createGraph();

  graph.addNode({
    id: "n1",
    position: { x: 0, y: 0, z: 0 },
    label: "n1",
  });

  const restore = patch(PersistenceService, "exportToFile", () => {
    return { ok: true, value: null };
  });

  const result = ExportGraphWorkflow.execute(graph, "graph.json");

  restore();

  assert.equal(result.ok, true);
  assert.equal(graph.getAllNodes().length, 1);
});

test("ExportGraphWorkflow returns ExportFailed when file export fails", () => {
  const graph = createGraph();

  graph.addNode({
    id: "n1",
    position: { x: 0, y: 0, z: 0 },
    label: "n1",
  });

  const restore = patch(PersistenceService, "exportToFile", () => {
    return { ok: false, reason: "ExportFailed" };
  });

  const result = ExportGraphWorkflow.execute(graph, "graph.json");

  restore();

  assert.equal(result.ok, false);
  assert.equal(result.reason, "ExportFailed");
  assert.equal(graph.getAllNodes().length, 1);
});
