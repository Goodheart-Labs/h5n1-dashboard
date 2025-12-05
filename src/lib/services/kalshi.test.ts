import { describe, expect, test } from "bun:test";
import { transformKalshiData } from "./kalshi";
import { KalshiResponse } from "../risk-index/types";

// Helper to create a Unix timestamp for a specific UTC hour
function utcTimestamp(
  year: number,
  month: number,
  day: number,
  hour: number,
): number {
  return Date.UTC(year, month - 1, day, hour, 0, 0) / 1000;
}

// Helper to create a mock candlestick
function mockCandlestick(timestamp: number, price: number) {
  return {
    end_period_ts: timestamp,
    yes_bid: { close: price },
    price: { open: price },
  };
}

describe("transformKalshiData", () => {
  test("returns empty array for null/undefined data", () => {
    expect(transformKalshiData(null as unknown as KalshiResponse)).toEqual([]);
    expect(transformKalshiData(undefined as unknown as KalshiResponse)).toEqual(
      [],
    );
    expect(transformKalshiData({} as KalshiResponse)).toEqual([]);
  });

  test("returns empty array for empty candlesticks array", () => {
    const data = {
      candlesticks: { candlesticks: [] },
    } as unknown as KalshiResponse;
    expect(transformKalshiData(data)).toEqual([]);
  });

  test("includes data points within UTC hours 8-23", () => {
    // Create candlesticks at UTC 10:00 and 14:00 - both should be included
    const data = {
      candlesticks: {
        candlesticks: [
          mockCandlestick(utcTimestamp(2024, 6, 15, 10), 0.25), // 10:00 UTC
          mockCandlestick(utcTimestamp(2024, 6, 15, 14), 0.3), // 14:00 UTC
        ],
      },
    } as unknown as KalshiResponse;

    const result = transformKalshiData(data);

    // Should have 5 data points (hours 10, 11, 12, 13, 14)
    expect(result.length).toBe(5);
    expect(result[0].value).toBe(0.25);
    expect(result[4].value).toBe(0.3);
  });

  test("excludes data points outside UTC hours 8-23", () => {
    // Create candlesticks spanning midnight UTC - early hours should be excluded
    const data = {
      candlesticks: {
        candlesticks: [
          mockCandlestick(utcTimestamp(2024, 6, 15, 2), 0.2), // 2:00 UTC - should be excluded
          mockCandlestick(utcTimestamp(2024, 6, 15, 10), 0.25), // 10:00 UTC - should be included
        ],
      },
    } as unknown as KalshiResponse;

    const result = transformKalshiData(data);

    // Hours 2-7 should be excluded, hours 8-10 included = 3 data points
    expect(result.length).toBe(3);
    // First included point should be at 8:00 UTC
    expect(new Date(result[0].date).getUTCHours()).toBe(8);
  });

  test("correctly uses UTC hours regardless of local timezone", () => {
    // This is the key test - a timestamp at 10:00 UTC should always be included,
    // regardless of what the local timezone is
    const utc10am = utcTimestamp(2024, 6, 15, 10);

    const data = {
      candlesticks: {
        candlesticks: [mockCandlestick(utc10am, 0.5)],
      },
    } as unknown as KalshiResponse;

    const result = transformKalshiData(data);

    // Should have exactly 1 data point
    expect(result.length).toBe(1);
    // Verify the ISO string shows 10:00 UTC
    expect(result[0].date).toBe("2024-06-15T10:00:00.000Z");
    expect(result[0].value).toBe(0.5);
  });

  test("forward-fills prices when candlesticks are missing", () => {
    // Gap between 10:00 and 13:00 - should forward-fill with last known price
    const data = {
      candlesticks: {
        candlesticks: [
          mockCandlestick(utcTimestamp(2024, 6, 15, 10), 0.25),
          mockCandlestick(utcTimestamp(2024, 6, 15, 13), 0.4),
        ],
      },
    } as unknown as KalshiResponse;

    const result = transformKalshiData(data);

    // Hours 10, 11, 12, 13 = 4 data points
    expect(result.length).toBe(4);
    expect(result[0].value).toBe(0.25); // 10:00
    expect(result[1].value).toBe(0.25); // 11:00 - forward-filled
    expect(result[2].value).toBe(0.25); // 12:00 - forward-filled
    expect(result[3].value).toBe(0.4); // 13:00 - updated
  });
});
