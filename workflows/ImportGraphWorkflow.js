import { PersistenceService } from "../services/persistence/PersistenceService.js";
import { CreateNode } from "../domain/operations/CreateNode.js";
import { ConnectNodes } from "../domain/operations/ConnectNodes.js";
import { DeleteNode } from "../domain/operations/DeleteNode.js";
import { RendererService } from "../services/renderer/RendererService.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

function isValidId(id) {
  return typeof id === "string" && id.length > 0;
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

function rollbackCreatedNodes(graph, createdNodeIds) {
  for (const nodeId of createdNodeIds) {
    try {
      DeleteNode.execute(graph, nodeId);
    } catch {}
  }
}

function buildVisualLinks(graph, links) {
  const visualLinks = [];

  for (const link of links) {
    const sourceNode = graph.getNode(link.sourceId);
    const targetNode = graph.getNode(link.targetId);

    if (!sourceNode || !targetNode) {
      return null;
    }

    visualLinks.push({
      id: link.id,
      sourcePosition: {
        x: sourceNode.position.x,
        y: sourceNode.position.y,
        z: sourceNode.position.z,
      },
      targetPosition: {
        x: targetNode.position.x,
        y: targetNode.position.y,
        z: targetNode.position.z,
      },
    });
  }

  return visualLinks;
}

export const ImportGraphWorkflow = {
  async execute(graph, fileHandle) {
    let readResult;

    try {
      readResult = await PersistenceService.importFromFile(fileHandle);
    } catch {
      return fail("ImportReadFailed");
    }

    if (!readResult || !readResult.ok) {
      return fail(readResult?.reason ?? "ImportReadFailed");
    }

    let parsed;

    try {
      parsed = JSON.parse(readResult.value);
    } catch {
      return fail("InvalidImportData");
    }

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.nodes) ||
      !Array.isArray(parsed.links)
    ) {
      return fail("InvalidImportData");
    }

    const nodeEntries = parsed.nodes;
    const linkEntries = parsed.links;
    const seenNodeIds = new Set();

    for (const nodeEntry of nodeEntries) {
      if (!nodeEntry || typeof nodeEntry !== "object") {
        return fail("InvalidImportData");
      }

      if (!isValidId(nodeEntry.id)) {
        return fail("InvalidImportData");
      }

      if (!isPosition3D(nodeEntry.position)) {
        return fail("InvalidImportData");
      }

      if (
        nodeEntry.label !== undefined &&
        nodeEntry.label !== null &&
        typeof nodeEntry.label !== "string"
      ) {
        return fail("InvalidImportData");
      }

      if (seenNodeIds.has(nodeEntry.id)) {
        return fail("InvalidImportData");
      }

      seenNodeIds.add(nodeEntry.id);
    }

    for (const linkEntry of linkEntries) {
      if (!linkEntry || typeof linkEntry !== "object") {
        return fail("InvalidImportData");
      }

      if (!isValidId(linkEntry.sourceId)) {
        return fail("InvalidImportData");
      }

      if (!isValidId(linkEntry.targetId)) {
        return fail("InvalidImportData");
      }
    }

    const existingNodes = graph.getAllNodes();

    for (const existingNode of existingNodes) {
      const deleteResult = DeleteNode.execute(graph, existingNode.id);

      if (!deleteResult.ok) {
        return fail("ImportFailedRolledBack");
      }
    }

    const createdNodeIds = [];
    const nodeIdMap = new Map();

    for (const nodeEntry of nodeEntries) {
      const createResult = CreateNode.execute(graph, {
        position: nodeEntry.position,
        label: nodeEntry.label,
        data: nodeEntry.data,
      });

      if (!createResult.ok) {
        rollbackCreatedNodes(graph, createdNodeIds);
        return fail("ImportFailedRolledBack");
      }

      const createdNode = createResult.value;

      createdNodeIds.push(createdNode.id);
      nodeIdMap.set(nodeEntry.id, createdNode.id);
    }

    for (const linkEntry of linkEntries) {
      const sourceId = nodeIdMap.get(linkEntry.sourceId);
      const targetId = nodeIdMap.get(linkEntry.targetId);

      if (!sourceId || !targetId) {
        rollbackCreatedNodes(graph, createdNodeIds);
        return fail("ImportFailedRolledBack");
      }

      const connectResult = ConnectNodes.execute(
        graph,
        sourceId,
        targetId,
        linkEntry.data
      );

      if (!connectResult.ok) {
        rollbackCreatedNodes(graph, createdNodeIds);
        return fail("ImportFailedRolledBack");
      }
    }

    const nodes = graph.getAllNodes();
    const links = graph.getAllLinks();
    const visualLinks = buildVisualLinks(graph, links);

    if (!visualLinks) {
      return {
        ok: false,
        reason: "SyncFailed",
        value: {
          nodeCount: nodes.length,
          linkCount: links.length,
        },
      };
    }

    let syncResult;

    try {
      syncResult = RendererService.renderGraphSnapshot(nodes, visualLinks);
    } catch {
      syncResult = fail("SyncFailed");
    }

    if (!syncResult.ok) {
      return {
        ok: false,
        reason: "SyncFailed",
        value: {
          nodeCount: nodes.length,
          linkCount: links.length,
        },
      };
    }

    return ok({
      nodeCount: nodes.length,
      linkCount: links.length,
    });
  },
};
