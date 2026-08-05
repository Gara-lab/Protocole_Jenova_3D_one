import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

function ok(value) {
  return { ok: true, value };
}

function fail(reason) {
  return { ok: false, reason };
}

function isVec3(value) {
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

class CameraServiceImplementation {
  initialized = false;
  camera = null;
  controls = null;
  canvas = null;

  initialize(canvasElement, initialCameraConfig) {
    if (this.initialized) {
      return ok(null);
    }

    if (
      !canvasElement ||
      !isVec3(initialCameraConfig?.position) ||
      !isVec3(initialCameraConfig?.target)
    ) {
      return fail("InitializationFailed");
    }

    try {
      const width = canvasElement.clientWidth || 1;
      const height = canvasElement.clientHeight || 1;

      const camera = new THREE.PerspectiveCamera(
        60,
        width / height,
        0.1,
        1000
      );

      camera.position.set(
        initialCameraConfig.position.x,
        initialCameraConfig.position.y,
        initialCameraConfig.position.z
      );

      const controls = new OrbitControls(camera, canvasElement);

      controls.target.set(
        initialCameraConfig.target.x,
        initialCameraConfig.target.y,
        initialCameraConfig.target.z
      );

      controls.enableDamping = true;
      controls.update();

      this.camera = camera;
      this.controls = controls;
      this.canvas = canvasElement;
      this.initialized = true;

      return ok(null);
    } catch {
      return fail("InitializationFailed");
    }
  }

  dispose() {
    this.controls?.dispose();

    this.camera = null;
    this.controls = null;
    this.canvas = null;
    this.initialized = false;
  }

  update() {
    if (!this.initialized || !this.camera || !this.controls || !this.canvas) {
      return fail("NotInitialized");
    }

    const width = this.canvas.clientWidth || 1;
    const height = this.canvas.clientHeight || 1;
    const aspect = width / height;

    if (this.camera.aspect !== aspect) {
      this.camera.aspect = aspect;
      this.camera.updateProjectionMatrix();
    }

    this.controls.update();

    return ok(null);
  }

  getCameraState() {
    if (!this.initialized || !this.camera || !this.controls) {
      return fail("NotInitialized");
    }

    return ok({
      position: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      },
      target: {
        x: this.controls.target.x,
        y: this.controls.target.y,
        z: this.controls.target.z,
      },
    });
  }

  setCameraState(position, target) {
    if (!this.initialized || !this.camera || !this.controls) {
      return fail("NotInitialized");
    }

    if (!isVec3(position) || !isVec3(target)) {
      return fail("InvalidCameraState");
    }

    this.camera.position.set(position.x, position.y, position.z);

    this.controls.target.set(target.x, target.y, target.z);

    this.controls.update();

    return ok(null);
  }
}

export const CameraService = new CameraServiceImplementation();
