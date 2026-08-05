import { GraphValidation } from "../validation/GraphValidation.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

export const DeleteNode = {
  execute(graph, nodeId) {
    const validation = GraphValidation.canRemoveNode(graph, nodeId);

    if (!validation.ok) {
      return fail(validation.reason);
    }

    const links = graph.getLinksForNode(nodeId) || [];
    const removedLinkIds = links.map((link) => link.id);

    graph.removeNode(nodeId);

    return ok({
      removedNodeId: nodeId,
      removedLinkIds,
    });
  },
};