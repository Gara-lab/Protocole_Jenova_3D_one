import { test } from "node:test";
import assert from "node:assert/strict";
import { CameraService } from "../../../services/camera/CameraService.js";

function resetCamera() {
  CameraService.initialized = false;
  CameraService.camera = null;
  CameraService.controls = null;
  CameraService.canvas = null;
}

test("CameraService rejects calls before initialization", () => {
  resetCamera();

  assert.equal(CameraService.update().reason, "NotInitialized");
  assert.equal(CameraService.getCameraState().reason, "NotInitialized");
  assert.equal(CameraService.getCameraInstance().reason, "NotInitialized");
  assert.equal(
    CameraService.setCameraState(
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 }
    ).reason,
    "NotInitialized"
  );
});

test("CameraService getCameraState returns plain copies", () => {
  resetCamera();

  const camera = {
    position: { x: 1, y: 2, z: 3 },
  };

  const controls = {
    target: { x: 4, y: 5, z: 6 },
  };

  CameraService.initialized = true;
  CameraService.camera = camera;
  CameraService.controls = controls;

  const result = CameraService.getCameraState();

  assert.equal(result.ok, true);
  assert.deepEqual(result.value.position, { x: 1, y: 2, z: 3 });
  assert.deepEqual(result.value.target, { x: 4, y: 5, z: 6 });

  result.value.position.x = 99;

  assert.equal(camera.position.x, 1);
});

test("CameraService getCameraInstance returns camera only after initialization", () => {
  resetCamera();

  assert.equal(CameraService.getCameraInstance().ok, false);

  const camera = {};

  CameraService.initialized = true;
  CameraService.camera = camera;

  const result = CameraService.getCameraInstance();

  assert.equal(result.ok, true);
  assert.equal(result.value, camera);
});

test("CameraService setCameraState rejects malformed input", () => {
  resetCamera();

  CameraService.initialized = true;
  CameraService.camera = {
    position: {
      set() {},
    },
  };
  CameraService.controls = {
    target: {
      set() {},
    },
    update() {},
  };

  const result = CameraService.setCameraState(
    { x: 1 },
    { x: 0, y: 0, z: 0 }
  );

  assert.equal(result.ok, false);
  assert.equal(result.reason, "InvalidCameraState");
});

test("CameraService setCameraState updates camera and controls", () => {
  resetCamera();

  const calls = [];

  CameraService.initialized = true;
  CameraService.camera = {
    position: {
      set(x, y, z) {
        calls.push(["position", x, y, z]);
      },
    },
  };
  CameraService.controls = {
    target: {
      set(x, y, z) {
        calls.push(["target", x, y, z]);
      },
    },
    update() {
      calls.push(["update"]);
    },
  };

  const result = CameraService.setCameraState(
    { x: 1, y: 2, z: 3 },
    { x: 4, y: 5, z: 6 }
  );

  assert.equal(result.ok, true);
  assert.deepEqual(calls, [
    ["position", 1, 2, 3],
    ["target", 4, 5, 6],
    ["update"],
  ]);
});

test("CameraService update advances controls and updates aspect", () => {
  resetCamera();

  const calls = [];

  CameraService.initialized = true;
  CameraService.canvas = {
    clientWidth: 2,
    clientHeight: 1,
  };
  CameraService.camera = {
    aspect: 0,
    updateProjectionMatrix() {
      calls.push("projection");
    },
  };
  CameraService.controls = {
    update() {
      calls.push("controls");
    },
  };

  const result = CameraService.update();

  assert.equal(result.ok, true);
  assert.equal(CameraService.camera.aspect, 2);
  assert.deepEqual(calls, ["projection", "controls"]);
});
