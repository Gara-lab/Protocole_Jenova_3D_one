import { GraphValidation } from "../validation/GraphValidation.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
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

export const MoveNode = {
  execute(graph, nodeId, position) {
    if (!isPosition3D(position)) {
      return fail("InvalidPosition");
    }

    const validation = GraphValidation.canUpdateNodePosition(
      graph,
      nodeId,
      position
    );

    if (!validation.ok) {
      return fail(validation.reason);
    }

    graph.updateNodePosition(nodeId, position);

    const updatedNode = graph.getNode(nodeId);

    if (!updatedNode) {
      return fail("NodeNotFound");
    }

    return ok(updatedNode);
  },
};