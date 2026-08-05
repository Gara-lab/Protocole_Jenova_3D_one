function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

function cloneData(data) {
  if (typeof structuredClone === "function") {
    return structuredClone(data);
  }

  return JSON.parse(JSON.stringify(data));
}

function cloneNode(node) {
  const position = {
    x: node.position.x,
    y: node.position.y,
    z: node.position.z,
  };

  Object.freeze(position);

  const cloned = {
    id: node.id,
    position,
    label: node.label ?? "",
  };

  if (node.data !== undefined) {
    cloned.data = cloneData(node.data);
  }

  return Object.freeze(cloned);
}

function cloneLink(link) {
  const cloned = {
    id: link.id,
    sourceId: link.sourceId,
    targetId: link.targetId,
  };

  if (link.data !== undefined) {
    cloned.data = cloneData(link.data);
  }

  return Object.freeze(cloned);
}

export class Graph {
  #nodes = new Map();
  #links = new Map();

  getNode(id) {
    return this.#nodes.get(id) ?? null;
  }

  getAllNodes() {
    return [...this.#nodes.values()];
  }

  getLink(id) {
    return this.#links.get(id) ?? null;
  }

  getAllLinks() {
    return [...this.#links.values()];
  }

  getLinksForNode(nodeId) {
    return [...this.#links.values()].filter(
      (link) => link.sourceId === nodeId || link.targetId === nodeId
    );
  }

  hasNode(id) {
    return this.#nodes.has(id);
  }

  hasLink(id) {
    return this.#links.has(id);
  }

  hasLinkBetween(sourceId, targetId) {
    return [...this.#links.values()].some(
      (link) => link.sourceId === sourceId && link.targetId === targetId
    );
  }

  addNode(node) {
    if (this.#nodes.has(node.id)) {
      return fail("DuplicateNodeId");
    }

    const storedNode = cloneNode(node);

    this.#nodes.set(storedNode.id, storedNode);

    return ok(storedNode);
  }

  removeNode(id) {
    if (!this.#nodes.has(id)) {
      return fail("NodeNotFound");
    }

    for (const link of [...this.#links.values()]) {
      if (link.sourceId === id || link.targetId === id) {
        this.#links.delete(link.id);
      }
    }

    this.#nodes.delete(id);

    return ok(null);
  }

  updateNodePosition(id, position) {
    const node = this.#nodes.get(id);

    if (!node) {
      return fail("NodeNotFound");
    }

    const updatedNode = cloneNode({
      ...node,
      position,
    });

    this.#nodes.set(id, updatedNode);

    return ok(updatedNode);
  }

  updateNodeLabel(id, label) {
    const node = this.#nodes.get(id);

    if (!node) {
      return fail("NodeNotFound");
    }

    const updatedNode = cloneNode({
      ...node,
      label,
    });

    this.#nodes.set(id, updatedNode);

    return ok(updatedNode);
  }

  addLink(link) {
    if (this.#links.has(link.id)) {
      return fail("DuplicateLinkId");
    }

    if (
      !this.#nodes.has(link.sourceId) ||
      !this.#nodes.has(link.targetId)
    ) {
      return fail("InvalidLinkEndpoints");
    }

    if (link.sourceId === link.targetId) {
      return fail("SelfLinkNotAllowed");
    }

    if (this.hasLinkBetween(link.sourceId, link.targetId)) {
      return fail("DuplicateLinkBetweenNodes");
    }

    const storedLink = cloneLink(link);

    this.#links.set(storedLink.id, storedLink);

    return ok(storedLink);
  }

  removeLink(id) {
    if (!this.#links.has(id)) {
      return fail("LinkNotFound");
    }

    this.#links.delete(id);

    return ok(null);
  }

  toJSON() {
    return JSON.stringify({
      nodes: this.getAllNodes(),
      links: this.getAllLinks(),
    });
  }
}

export function createGraph() {
  return new Graph();
}
