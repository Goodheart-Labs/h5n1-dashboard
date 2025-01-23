import { describe, expect, test } from "bun:test";
import { getInterpolatedValue } from "./getInterpolatedValue";
import { ChartDataPoint } from "./types";

describe("getInterpolatedValue", () => {
  const sampleData: ChartDataPoint[] = [
    { date: "2024-01-01T12:00:00.000Z", value: 10 },
    { date: "2024-01-02T12:00:00.000Z", value: 20 },
    { date: "2024-01-04T12:00:00.000Z", value: 40 },
  ];

  test("returns exact match when found", () => {
    const result = getInterpolatedValue(sampleData, "2024-01-02T12:00:00.000Z");
    expect(result).toBe(20);
  });

  test("interpolates between two points", () => {
    const result = getInterpolatedValue(sampleData, "2024-01-03T12:00:00.000Z");
    // Should be halfway between 20 and 40
    expect(result).toBe(30);
  });

  test("returns closest value when target is before all points", () => {
    const result = getInterpolatedValue(sampleData, "2023-12-31T12:00:00.000Z");
    expect(result).toBe(10);
  });

  test("returns closest value when target is after all points", () => {
    const result = getInterpolatedValue(sampleData, "2024-01-05T12:00:00.000Z");
    expect(result).toBe(40);
  });

  test("handles empty dataset", () => {
    const result = getInterpolatedValue([], "2024-01-01T12:00:00.000Z");
    expect(result).toBeUndefined();
  });

  test("handles unsorted data", () => {
    const unsortedData = [
      { date: "2024-01-04T12:00:00.000Z", value: 40 },
      { date: "2024-01-01T12:00:00.000Z", value: 10 },
      { date: "2024-01-02T12:00:00.000Z", value: 20 },
    ];
    const result = getInterpolatedValue(
      unsortedData,
      "2024-01-03T12:00:00.000Z",
    );
    expect(result).toBe(30);
  });
});
