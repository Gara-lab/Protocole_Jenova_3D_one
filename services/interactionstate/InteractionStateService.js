function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

function isValidId(id) {
  return typeof id === "string" && id.length > 0;
}

class InteractionStateServiceImplementation {
  mode = "idle";
  pendingFirstNodeId = null;
  selectedLinkId = null;

  getMode() {
    return this.mode;
  }

  beginConnectMode(firstNodeId) {
    if (!isValidId(firstNodeId)) {
      return fail("NodeIdRequired");
    }

    if (this.mode === "awaitingSecondNode") {
      return fail("AlreadyAwaitingSecondNode");
    }

    this.mode = "awaitingSecondNode";
    this.pendingFirstNodeId = firstNodeId;

    return ok(null);
  }

  getPendingFirstNodeId() {
    return this.pendingFirstNodeId;
  }

  resetConnectMode() {
    this.mode = "idle";
    this.pendingFirstNodeId = null;

    return ok(null);
  }

  getSelectedLinkId() {
    return this.selectedLinkId;
  }

  selectLink(linkId) {
    if (!isValidId(linkId)) {
      return fail("LinkIdRequired");
    }

    this.selectedLinkId = linkId;

    return ok(null);
  }

  clearSelectedLink() {
    this.selectedLinkId = null;

    return ok(null);
  }
}

export const InteractionStateService =
  new InteractionStateServiceImplementation();
