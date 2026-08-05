import { test } from "node:test";
import assert from "node:assert/strict";
import * as LinkModule from "../../../domain/graph/Link.js";

function createLink(input) {
  const module = LinkModule.default ?? LinkModule;

  if (typeof module.createLink === "function") {
    return module.createLink(input);
  }

  if (typeof module.Link === "function") {
    return new module.Link(input);
  }

  if (typeof module === "function") {
    return new module(input);
  }

  throw new Error("Link module does not expose createLink or Link");
}

test("Link holds the fields defined in its contract", () => {
  const link = createLink({
    id: "link-1",
    sourceId: "node-1",
    targetId: "node-2",
  });

  assert.equal(link.id, "link-1");
  assert.equal(link.sourceId, "node-1");
  assert.equal(link.targetId, "node-2");
});

test("Link id is immutable after creation", () => {
  const link = createLink({
    id: "link-1",
    sourceId: "node-1",
    targetId: "node-2",
  });

  assert.throws(() => {
    link.id = "changed";
  });

  assert.equal(link.id, "link-1");
});
