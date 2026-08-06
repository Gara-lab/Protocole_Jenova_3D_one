import * as THREE from "three";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

class RendererServiceImplementation {
  initialized = false;
  canvas = null;
  scene = null;
  renderer = null;
  camera = null;

  nodeGeometry = null;
  nodeMaterial = null;
  linkMaterial = null;

  nodeMeshes = new Map();
  linkLines = new Map();

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  initialize(canvasElement) {
    if (this.initialized) {
      return ok(null);
    }

    try {
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasElement,
        antialias: true,
      });

      const width = canvasElement.clientWidth || 1;
      const height = canvasElement.clientHeight || 1;

      renderer.setSize(width, height, false);

      const scene = new THREE.Scene();

      const camera = new THREE.PerspectiveCamera(
        60,
        width / height,
        0.1,
        1000
      );

      camera.position.set(0, 0, 5);

      const ambientLight = new THREE.AmbientLight(0xffffff, 1);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);

      directionalLight.position.set(1, 1, 1);

      scene.add(ambientLight);
      scene.add(directionalLight);

      this.canvas = canvasElement;
      this.scene = scene;
      this.renderer = renderer;
      this.camera = camera;

      this.nodeGeometry = new THREE.BoxGeometry(1, 1, 1);
      this.nodeMaterial = new THREE.MeshStandardMaterial({
        color: 0x3399ff,
      });

      this.linkMaterial = new THREE.LineBasicMaterial({
        color: 0x999999,
      });

      this.raycaster.params.Line.threshold = 0.1;

      this.initialized = true;

      return ok(null);
    } catch {
      return fail("InitializationFailed");
    }
  }

  dispose() {
    this.clearVisuals();

    this.nodeGeometry?.dispose();
    this.nodeMaterial?.dispose();
    this.linkMaterial?.dispose();
    this.renderer?.dispose();

    this.canvas = null;
    this.scene = null;
    this.renderer = null;
    this.camera = null;
    this.nodeGeometry = null;
    this.nodeMaterial = null;
    this.linkMaterial = null;
    this.initialized = false;
  }

  addNodeVisual(node) {
    if (
      !this.initialized ||
      !this.scene ||
      !this.nodeGeometry ||
      !this.nodeMaterial
    ) {
      return fail("NotInitialized");
    }

    const existing = this.nodeMeshes.get(node.id);

    if (existing) {
      this.scene.remove(existing);
    }

    const mesh = new THREE.Mesh(this.nodeGeometry, this.nodeMaterial);

    mesh.position.set(node.position.x, node.position.y, node.position.z);
    mesh.userData = {
      type: "node",
      id: node.id,
    };

    this.scene.add(mesh);
    this.nodeMeshes.set(node.id, mesh);

    return ok(null);
  }

  updateNodeVisual(nodeId, position) {
    if (!this.initialized || !this.scene) {
      return fail("NotInitialized");
    }

    const mesh = this.nodeMeshes.get(nodeId);

    if (!mesh) {
      return fail("NodeVisualNotFound");
    }

    mesh.position.set(position.x, position.y, position.z);

    return ok(null);
  }

  removeNodeVisual(nodeId) {
    if (!this.initialized || !this.scene) {
      return fail("NotInitialized");
    }

    const mesh = this.nodeMeshes.get(nodeId);

    if (!mesh) {
      return fail("NodeVisualNotFound");
    }

    this.scene.remove(mesh);
    this.nodeMeshes.delete(nodeId);

    return ok(null);
  }
  
  getVisualObject(nodeId) {
    if (!this.initialized) {
      return null;
  }

  return this.nodeMeshes.get(nodeId) ?? null;
}
  addLinkVisual(link, sourcePosition, targetPosition) {
    if (!this.initialized || !this.scene || !this.linkMaterial) {
      return fail("NotInitialized");
    }

    const existing = this.linkLines.get(link.id);

    if (existing) {
      this.scene.remove(existing);
      existing.geometry.dispose();
      this.linkLines.delete(link.id);
    }

    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(
        sourcePosition.x,
        sourcePosition.y,
        sourcePosition.z
      ),
      new THREE.Vector3(
        targetPosition.x,
        targetPosition.y,
        targetPosition.z
      ),
    ]);

    const line = new THREE.Line(geometry, this.linkMaterial);

    line.userData = {
      type: "link",
      id: link.id,
    };

    this.scene.add(line);
    this.linkLines.set(link.id, line);

    return ok(null);
  }

  removeLinkVisual(linkId) {
    if (!this.initialized || !this.scene) {
      return fail("NotInitialized");
    }

    const line = this.linkLines.get(linkId);

    if (!line) {
      return fail("LinkVisualNotFound");
    }

    this.scene.remove(line);
    line.geometry.dispose();
    this.linkLines.delete(linkId);

    return ok(null);
  }

  renderGraphSnapshot(nodes, links) {
    if (!this.initialized || !this.scene) {
      return fail("NotInitialized");
    }

    this.clearVisuals();

    for (const node of nodes) {
      const result = this.addNodeVisual(node);

      if (!result.ok) {
        return result;
      }
    }

    for (const link of links) {
      const result = this.addLinkVisual(
        { id: link.id },
        link.sourcePosition,
        link.targetPosition
      );

      if (!result.ok) {
        return result;
      }
    }

    return ok(null);
  }

  pickObjectAt(screenX, screenY) {
    if (!this.initialized || !this.canvas || !this.camera || !this.scene) {
      return null;
    }

    const rect = this.canvas.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) {
      return null;
    }

    this.pointer.x = ((screenX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((screenY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    const objects = [
      ...this.nodeMeshes.values(),
      ...this.linkLines.values(),
    ];

    const hits = this.raycaster.intersectObjects(objects, false);

    for (const hit of hits) {
      const userData = hit.object.userData;

      if (
        userData &&
        (userData.type === "node" || userData.type === "link") &&
        typeof userData.id === "string"
      ) {
        return {
          type: userData.type,
          id: userData.id,
        };
      }
    }

    return null;
  }

renderFrame(cameraState) {
  if (!this.initialized || !this.renderer || !this.camera || !this.scene) {
    return fail("NotInitialized");
  }

  this.camera.position.set(
    cameraState.position.x,
    cameraState.position.y,
    cameraState.position.z
  );

  if (cameraState.target) {
    this.camera.lookAt(
      cameraState.target.x,
      cameraState.target.y,
      cameraState.target.z
    );
  } else if (cameraState.orientation) {
    this.camera.quaternion.set(
      cameraState.orientation.x,
      cameraState.orientation.y,
      cameraState.orientation.z,
      cameraState.orientation.w
    );
  }

  this.camera.updateMatrixWorld();

  this.renderer.render(this.scene, this.camera);

  return ok(null);
  }

  clearVisuals() {
    if (!this.scene) {
      return;
    }

    for (const mesh of this.nodeMeshes.values()) {
      this.scene.remove(mesh);
    }

    for (const line of this.linkLines.values()) {
      this.scene.remove(line);
      line.geometry.dispose();
    }

    this.nodeMeshes.clear();
    this.linkLines.clear();
  }
}

export const RendererService = new RendererServiceImplementation();
