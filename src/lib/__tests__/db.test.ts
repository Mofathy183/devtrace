import { describe, it, expect, vi } from "vitest";
import { runQuery, DbUnavailableError } from "@/lib/db";
import type { Session, QueryResult, Record as Neo4jRecord } from "neo4j-driver";

/** Builds a fake Session whose `run` resolves with the given plain-object rows. */
function fakeSessionReturning(rows: Record<string, unknown>[]): Session {
  const records = rows.map((row) => ({
    toObject: () => row,
  })) as unknown as Neo4jRecord[];

  return {
    run: vi.fn().mockResolvedValue({ records } as unknown as QueryResult),
    close: vi.fn().mockResolvedValue(undefined),
  } as unknown as Session;
}

/** Builds a fake Session whose `run` rejects, simulating a driver failure. */
function fakeSessionThatFails(err: Error): Session {
  return {
    run: vi.fn().mockRejectedValue(err),
    close: vi.fn().mockResolvedValue(undefined),
  } as unknown as Session;
}

describe("runQuery", () => {
  it("maps Neo4j records to plain row objects", async () => {
    const session = fakeSessionReturning([
      { id: "beggy", name: "Beggy" },
      { id: "pyledger", name: "PyLedger" },
    ]);

    const rows = await runQuery<{ id: string; name: string }>(
      `MATCH (p:Project) RETURN p.id AS id, p.name AS name`,
      {},
      () => session
    );

    expect(rows).toEqual([
      { id: "beggy", name: "Beggy" },
      { id: "pyledger", name: "PyLedger" },
    ]);
  });

  it("passes params through to session.run untouched", async () => {
    const session = fakeSessionReturning([]);
    await runQuery(
      `MATCH (p:Project {id: $id}) RETURN p`,
      { id: "beggy" },
      () => session
    );

    expect(session.run).toHaveBeenCalledWith(
      `MATCH (p:Project {id: $id}) RETURN p`,
      { id: "beggy" }
    );
  });

  it("always closes the session, even when the query succeeds", async () => {
    const session = fakeSessionReturning([]);
    await runQuery(`RETURN 1`, {}, () => session);
    expect(session.close).toHaveBeenCalledOnce();
  });

  it("closes the session even when the query throws", async () => {
    const session = fakeSessionThatFails(new Error("connection reset"));
    await expect(runQuery(`RETURN 1`, {}, () => session)).rejects.toThrow();
    expect(session.close).toHaveBeenCalledOnce();
  });

  it("throws DbUnavailableError with the original error as cause when the query fails", async () => {
    const originalError = new Error("ECONNREFUSED");
    const session = fakeSessionThatFails(originalError);

    await expect(runQuery(`RETURN 1`, {}, () => session)).rejects.toMatchObject(
      {
        name: "DbUnavailableError",
      }
    );

    try {
      await runQuery(`RETURN 1`, {}, () => fakeSessionThatFails(originalError));
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(DbUnavailableError);
      expect((err as DbUnavailableError).cause).toBe(originalError);
    }
  });

  it("defaults params to an empty object when omitted", async () => {
    const session = fakeSessionReturning([]);
    await runQuery(`RETURN 1`, undefined, () => session);
    expect(session.run).toHaveBeenCalledWith(`RETURN 1`, {});
  });
});
