export function canAddNode(graph, node) {
  if (graph.hasNode(node.id)) {
    return { ok: false, reason: "DuplicateNodeId" };
  }

  return { ok: true };
}

export function canRemoveNode(graph, id) {
  if (!graph.hasNode(id)) {
    return { ok: false, reason: "NodeNotFound" };
  }

  return { ok: true };
}

export function canUpdateNodePosition(graph, id, _position) {
  if (!graph.hasNode(id)) {
    return { ok: false, reason: "NodeNotFound" };
  }

  return { ok: true };
}

export function canUpdateNodeLabel(graph, id, _label) {
  if (!graph.hasNode(id)) {
    return { ok: false, reason: "NodeNotFound" };
  }

  return { ok: true };
}

export function canAddLink(graph, link) {
  if (graph.hasLink(link.id)) {
    return { ok: false, reason: "DuplicateLinkId" };
  }

  if (!graph.hasNode(link.sourceId) || !graph.hasNode(link.targetId)) {
    return { ok: false, reason: "InvalidLinkEndpoints" };
  }

  if (link.sourceId === link.targetId) {
    return { ok: false, reason: "SelfLinkNotAllowed" };
  }

  if (graph.hasLinkBetween(link.sourceId, link.targetId)) {
    return { ok: false, reason: "DuplicateLinkBetweenNodes" };
  }

  return { ok: true };
}

export function canRemoveLink(graph, id) {
  if (!graph.hasLink(id)) {
    return { ok: false, reason: "LinkNotFound" };
  }

  return { ok: true };
}

export const GraphValidation = {
  canAddNode,
  canRemoveNode,
  canUpdateNodePosition,
  canUpdateNodeLabel,
  canAddLink,
  canRemoveLink,
};
