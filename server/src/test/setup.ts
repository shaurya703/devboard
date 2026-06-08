import { mockReset } from "jest-mock-extended";
import { prismaMock } from "./prismaMock";

// Fresh mock state between tests.
beforeEach(() => {
  mockReset(prismaMock);
});
