import { describe, expect, it, vi } from "vitest";
import { chunk, sleep } from ".";

describe("chunk", () => {
    it("splits array into chunks of given size", () => {
        const result = chunk([1, 2, 3, 4, 5], 2);

        expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("returns single chunk when size is larger than array", () => {
        const result = chunk([1, 2, 3], 10);

        expect(result).toEqual([[1, 2, 3]]);
    });

    it("returns empty array when input is empty", () => {
        const result = chunk([], 3);

        expect(result).toEqual([]);
    });

    it("handles size of 1", () => {
        const result = chunk([1, 2, 3], 1);

        expect(result).toEqual([[1], [2], [3]]);
    });

    it("handles exact division", () => {
        const result = chunk([1, 2, 3, 4], 2);

        expect(result).toEqual([[1, 2], [3, 4]]);
    });

    it("does not mutate original array", () => {
        const input = [1, 2, 3];
        chunk(input, 2);

        expect(input).toEqual([1, 2, 3]);
    });
});

describe("sleep", () => {
    it("resolves after given time", async () => {
        vi.useFakeTimers();

        const spy = vi.fn();

        sleep(1000).then(spy);

        // not resolved yet
        expect(spy).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1000);

        // wait for microtask queue
        await Promise.resolve();

        expect(spy).toHaveBeenCalled();

        vi.useRealTimers();
    });

    it("works with await", async () => {
        vi.useFakeTimers();

        const promise = sleep(500);

        vi.advanceTimersByTime(500);

        await expect(promise).resolves.toBeUndefined();

        vi.useRealTimers();
    });
});