import { createUUID } from "./generators";

describe("createUUID", () => {
    it("returns a string in UUID v4 format", () => {
        const uuid = createUUID();
        expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it("returns a unique value on each call", () => {
        const ids = new Set([createUUID(), createUUID(), createUUID(), createUUID(), createUUID()]);
        expect(ids.size).toBe(5);
    });
});
