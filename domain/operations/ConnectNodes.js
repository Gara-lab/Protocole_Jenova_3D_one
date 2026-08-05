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

export const ConnectNodes = {
  execute(graph, sourceId, targetId, linkData) {
    const link = {
      id: createId(),
      sourceId,
      targetId,
      ...(linkData !== undefined ? { data: linkData } : {}),
    };

    const validation = GraphValidation.canAddLink(graph, link);

    if (!validation.ok) {
      return fail(validation.reason);
    }

    graph.addLink(link);

    return ok(link);
  },
};