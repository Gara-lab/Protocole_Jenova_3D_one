import type { Graph, Link, Node, NodeId, LinkId } from "../graph";
import type { Position3D } from "../../core/types";
import { GraphValidation, type GraphValidationFailure } from "../validation";

export type OperationFailure =
  | GraphValidationFailure
  | "InvalidNodeInput"
  | "InvalidPosition";

export type OperationResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: OperationFailure };

export type CreateNodeInput = {
  position?: Position3D;
  label?: string;
  data?: unknown;
};

export type DeleteNodeResult = OperationResult<{
  removedNodeId: NodeId;
  removedLinkIds: LinkId[];
}>;

export type MoveNodeResult = OperationResult<Node>;

export type ConnectNodesResult = OperationResult<Link>;

export type DisconnectNodesResult = OperationResult<{
  removedLinkId: LinkId;
}>;

function ok<T>(value: T): OperationResult<T> {
  return { ok: true, value };
}

function fail<T>(reason: OperationFailure): OperationResult<T> {
  return { ok: false, reason };
}

function createId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isPosition3D(value: unknown): value is Position3D {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const position = value as Position3D;

  return (
    typeof position.x === "number" &&
    Number.isFinite(position.x) &&
    typeof position.y === "number" &&
    Number.isFinite(position.y) &&
    typeof position.z === "number" &&
    Number.isFinite(position.z)
  );
}

export const CreateNode = {
  execute(graph: Graph, input: CreateNodeInput): OperationResult<Node> {
    if (!isPosition3D(input.position)) {
      return fail("InvalidNodeInput");
    }

    const node = {
      id: createId(),
      position: input.position,
      label: input.label ?? "",
      ...(input.data !== undefined ? { data: input.data } : {}),
    } as Node;

    const validation = GraphValidation.canAddNode(graph, node);

    if (!validation.ok) {
      return fail(validation.reason);
    }

    graph.addNode(node);

    return ok(node);
  },
};

export const DeleteNode = {
  execute(graph: Graph, nodeId: NodeId): DeleteNodeResult {
    const validation = GraphValidation.canRemoveNode(graph, nodeId);

    if (!validation.ok) {
      return fail(validation.reason);
    }

    const links = graph.getLinksForNode(nodeId);
    const removedLinkIds = links.map((link) => link.id);

    graph.removeNode(nodeId);

    return ok({
      removedNodeId: nodeId,
      removedLinkIds,
    });
  },
};

export const MoveNode = {
  execute(
    graph: Graph,
    nodeId: NodeId,
    position: Position3D
  ): MoveNodeResult {
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

export const ConnectNodes = {
  execute(
    graph: Graph,
    sourceId: NodeId,
    targetId: NodeId,
    linkData?: unknown
  ): ConnectNodesResult {
    const link = {
      id: createId(),
      sourceId,
      targetId,
      ...(linkData !== undefined ? { data: linkData } : {}),
    } as Link;

    const validation = GraphValidation.canAddLink(graph, link);

    if (!validation.ok) {
      return fail(validation.reason);
    }

    graph.addLink(link);

    return ok(link);
  },
};

export const DisconnectNodes = {
  execute(graph: Graph, linkId: LinkId): DisconnectNodesResult {
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

export const Operations = {
  CreateNode,
  DeleteNode,
  MoveNode,
  ConnectNodes,
  DisconnectNodes,
};