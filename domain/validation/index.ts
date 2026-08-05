import type { Link, Node, NodeId, LinkId } from "../graph";
import type { Position3D } from "../../core/types";

export type GraphValidationFailure =
  | "DuplicateNodeId"
  | "NodeNotFound"
  | "DuplicateLinkId"
  | "InvalidLinkEndpoints"
  | "SelfLinkNotAllowed"
  | "DuplicateLinkBetweenNodes"
  | "LinkNotFound";

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: GraphValidationFailure };

export type GraphValidationView = {
  hasNode(id: NodeId): boolean;
  hasLink(id: LinkId): boolean;
  hasLinkBetween(sourceId: NodeId, targetId: NodeId): boolean;
};

export function canAddNode(
  graph: GraphValidationView,
  node: Node
): ValidationResult {
  if (graph.hasNode(node.id)) {
    return { ok: false, reason: "DuplicateNodeId" };
  }

  return { ok: true };
}

export function canRemoveNode(
  graph: GraphValidationView,
  id: NodeId
): ValidationResult {
  if (!graph.hasNode(id)) {
    return { ok: false, reason: "NodeNotFound" };
  }

  return { ok: true };
}

export function canUpdateNodePosition(
  graph: GraphValidationView,
  id: NodeId,
  _position: Position3D
): ValidationResult {
  if (!graph.hasNode(id)) {
    return { ok: false, reason: "NodeNotFound" };
  }

  return { ok: true };
}

export function canUpdateNodeLabel(
  graph: GraphValidationView,
  id: NodeId,
  _label: string
): ValidationResult {
  if (!graph.hasNode(id)) {
    return { ok: false, reason: "NodeNotFound" };
  }

  return { ok: true };
}

export function canAddLink(
  graph: GraphValidationView,
  link: Link
): ValidationResult {
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

export function canRemoveLink(
  graph: GraphValidationView,
  id: LinkId
): ValidationResult {
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
