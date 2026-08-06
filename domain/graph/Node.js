export function createNode(input) {
  if (!input || typeof input.id !== "string" || !input.position) {
    throw new Error("Invalid Node input: id and position are required");
  }

  const position = Object.freeze({
    x: input.position.x,
    y: input.position.y,
    z: input.position.z,
  });

  const node = {
    id: input.id,
    position,
    label: input.label ?? "",
  };

  if (input.data !== undefined) {
    node.data = input.data;
  }

  return Object.freeze(node);
}
