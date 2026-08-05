import { GraphValidation } from "../validation/GraphValidation.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

function createId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isPosition3D(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return (
    typeof value.x === "number" &&
    Number.isFinite(value.x) &&
    typeof value.y === "number" &&
    Number.isFinite(value.y) &&
    typeof value.z === "number" &&
    Number.isFinite(value.z)
  );
}

export const CreateNode = {
  execute(graph, input) {
    if (!input || !isPosition3D(input.position)) {
      return fail("InvalidNodeInput");
    }

    const node = {
      id: createId(),
      position: input.position,
      label: input.label ?? "",
      ...(input.data !== undefined ? { data: input.data } : {}),
    };

    const validation = GraphValidation.canAddNode(graph, node);

    if (!validation.ok) {
      return fail(validation.reason);
    }

    graph.addNode(node);

    return ok(node);
  },
};