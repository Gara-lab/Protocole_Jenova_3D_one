import { test } from "node:test";
import assert from "node:assert/strict";
import * as NodeModule from "../../../domain/graph/Node.js";

function createNode(input) {
  const module = NodeModule.default ?? NodeModule;

  if (typeof module.createNode === "function") {
    return module.createNode(input);
  }

  if (typeof module.Node === "function") {
    return new module.Node(input);
  }

  if (typeof module === "function") {
    return new module(input);
  }

  throw new Error("Node module does not expose createNode or Node");
}

test("Node holds the fields defined in its contract", () => {
  const node = createNode({
    id: "node-1",
    position: { x: 1, y: 2, z: 3 },
    label: "Node 1",
  });

  assert.equal(node.id, "node-1");
  assert.deepEqual(node.position, { x: 1, y: 2, z: 3 });
  assert.equal(node.label, "Node 1");
});

test("Node id is immutable after creation", () => {
  const node = createNode({
    id: "node-1",
    position: { x: 0, y: 0, z: 0 },
    label: "Node 1",
  });

  assert.throws(() => {
    node.id = "changed";
  });

  assert.equal(node.id, "node-1");
});
