import { GraphValidation } from "../validation/GraphValidation.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

export const DisconnectNodes = {
  execute(graph, linkId) {
    const validation = GraphValidation.canRemoveLink(graph, linkId);

    if (!validation.ok) {
      return fail(validation.reason);
    }

    graph.removeLink(linkId);

    return ok({
      removedLinkId: linkId,
    });
  },
};