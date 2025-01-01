/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";

// Types for our data
type TimeSeriesData = {
  date: string;
  value: number;
};

type DashboardData = {
  cases: TimeSeriesData[];
  mortality: TimeSeriesData[];
  spread: TimeSeriesData[];
  mutations: TimeSeriesData[];
};

// Helper component for line graphs
const LineGraph = ({
  data,
  color,
  label,
}: {
  data: TimeSeriesData[];
  color: string;
  label: string;
}) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - (d.value / maxValue) * 90;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="relative h-64 w-full">
      <div className="absolute top-0 left-0 text-sm text-gray-500">{label}</div>
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="absolute bottom-0 right-0 text-sm text-gray-500">
        Latest: {data[data.length - 1].value}
      </div>
    </div>
  );
};

// Generate mock data with fixed values
const generateMockData = (): DashboardData => ({
  cases: Array.from({ length: 12 }, (_, i) => ({
    date: `2023-${i + 1}`,
    value: 100 + i * 50,
  })),
  mortality: Array.from({ length: 12 }, (_, i) => ({
    date: `2023-${i + 1}`,
    value: 20 + i * 2,
  })),
  spread: Array.from({ length: 12 }, (_, i) => ({
    date: `2023-${i + 1}`,
    value: 10 + i,
  })),
  mutations: Array.from({ length: 12 }, (_, i) => ({
    date: `2023-${i + 1}`,
    value: 5 + Math.floor(i / 2),
  })),
});

// Initial empty state
const emptyData: DashboardData = {
  cases: Array.from({ length: 12 }, (_, i) => ({
    date: `2023-${i + 1}`,
    value: 0,
  })),
  mortality: Array.from({ length: 12 }, (_, i) => ({
    date: `2023-${i + 1}`,
    value: 0,
  })),
  spread: Array.from({ length: 12 }, (_, i) => ({
    date: `2023-${i + 1}`,
    value: 0,
  })),
  mutations: Array.from({ length: 12 }, (_, i) => ({
    date: `2023-${i + 1}`,
    value: 0,
  })),
};

const POLYMARKET_SLUG =
  "another-state-declare-a-state-of-emergency-over-bird-flu-before-february";
const METACULUS_QUESTION_ID = 30960;
const MANIFOLD_SLUG = "will-there-be-more-than-1000-confir";
export default function Home() {
  const [data, setData] = useState<DashboardData>(emptyData);
  const [mounted, setMounted] = useState(false);
  // const [cdcData, setCdcData] = useState<any>(null);
  const [polymarketData, setPolymarketData] = useState<any>(null);
  const [timeseriesData, setTimeseriesData] = useState<any>(null);
  const [metaculusData, setMetaculusData] = useState<any>(null);
  useEffect(() => {
    setMounted(true);
    setData(generateMockData());
    fetch(`/api/polymarket?slug=${POLYMARKET_SLUG}`)
      .then((res) => res.json())
      .then((data) => setPolymarketData(data))
      .catch((error) =>
        console.error("Error fetching Polymarket data:", error)
      );
  }, []);
  const [manifoldData, setManifoldData] = useState<any>(null);

  useEffect(() => {
    if (!polymarketData) return;

    const tokenIdsString = polymarketData?.clobTokenIds;
    if (!tokenIdsString) return;

    const tokenIds = JSON.parse(tokenIdsString);
    if (!tokenIds) return;

    const clobTokenId = tokenIds[0];
    if (!clobTokenId) return;

    fetch(`/api/polymarket-timeseries?marketId=${clobTokenId}`)
      .then((res) => res.json())
      .then((data) => setTimeseriesData(data))
      .catch((error) =>
        console.error("Error fetching Polymarket timeseries data:", error)
      );
  }, [polymarketData]);

  // useEffect(() => {
  //   fetch("/api/cdc-data")
  //     .then((res) => res.json())
  //     .then((data) => setCdcData(data))
  //     .catch((error) => console.error("Error fetching CDC data:", error));
  // }, []);

  useEffect(() => {
    fetch(`/api/metaculus?questionId=${METACULUS_QUESTION_ID}`)
      .then((res) => res.json())
      .then((data) => setMetaculusData(data))
      .catch((error) => console.error("Error fetching Metaculus data:", error));
  }, []);

  useEffect(() => {
    fetch(`/api/manifold?slug=${MANIFOLD_SLUG}`)
      .then((res) => res.json())
      .then((data) => setManifoldData(data))
      .catch((error) => console.error("Error fetching Manifold data:", error));
  }, []);

  if (!mounted) {
    return null; // or a loading skeleton
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen bg-gray-100 p-6 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="mb-8 text-center max-w-6xl mx-auto w-full">
        <h1 className="text-4xl md:text-6xl font-bold text-black mb-4">
          Will H5N1 be a disaster?
        </h1>
        <p className="text-2xl text-gray-700 mb-4">
          [Probably not] - our risk index gives it [5 out of 100 (about 5%)]
        </p>
        <p className="text-xl text-gray-600">
          Real-time monitoring of avian flu data sources
        </p>
      </header>

      <main className="space-y-6 max-w-6xl mx-auto w-full">
        {/* Main Graph */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-black mb-4">
            H5N1 Risk Index
          </h2>
          <LineGraph
            data={data.cases}
            color="#ef4444"
            label="Cases over time"
          />
        </div>

        {/* Grid of smaller graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-black mb-4">
              Another state declare a state of emergency over bird flu before
              February?
            </h2>
            <LineGraph
              data={data.mortality}
              color="#3b82f6"
              label="Deaths per 100 cases"
            />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-black mb-4">
              Will CDC report 10,000 or more H5 avian influenza cases in the
              United States before January 1, 2026?
            </h2>
            <LineGraph
              data={data.spread}
              color="#10b981"
              label="Countries affected"
            />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-black mb-4">Some CDC</h2>
            <LineGraph
              data={data.mutations}
              color="#8b5cf6"
              label="New variants detected"
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center text-gray-500 text-sm max-w-6xl mx-auto w-full">
        <div className="mb-8 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-black mb-2">
            Stay Updated
          </h3>
          <p className="text-gray-600 mb-4">
            Get update H5N1 risk levels and other risk dashboards.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
            onSubmit={(e) => {
              e.preventDefault();
              const email = (e.target as HTMLFormElement).email.value;
              alert(`Thanks! We'll send updates to ${email}`);
              (e.target as HTMLFormElement).reset();
            }}
          >
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Subscribe
            </button>
          </form>
        </div>
        <div className="mb-8 text-gray-600">
          <p className="mb-2">
            If you want to vote for other things to be included in the index or
            to see other data sources on this site,{" "}
            <a
              href="#"
              className="text-blue-500 hover:text-blue-600 underline"
              onClick={(e) => {
                e.preventDefault();
                alert("Poll coming soon!");
              }}
            >
              please vote using this 2 minute poll
            </a>
          </p>
        </div>
        <p>Data is simulated for demonstration purposes</p>
        <p>Last updated: {mounted ? new Date().toLocaleDateString() : ""}</p>
      </footer>
      {/* <pre>{JSON.stringify(cdcData, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(polymarketData, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(timeseriesData, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(metaculusData, null, 2)}</pre> */}
      {/* <pre>{JSON.stringify(manifoldData, null, 2)}</pre> */}
    </div>
  );
}
