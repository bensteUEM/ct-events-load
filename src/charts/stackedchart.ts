import type { DataPoint } from "./dtypes";
import {
    Chart,
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from "chart.js";

// Register chart.js components once
Chart.register(
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
);

// Store chart instances by containerId
const chartInstances: Record<string, Chart> = {};

/**
 * Create a stacked chart
 * @param containerId reference for canvas to use
 * @param dataPoints 
 * @param chartColors 
 * @returns 
 */
export function renderStackedChart(
    containerId: string,
    dataPoints: DataPoint[],
    chartColors: string[]
): Chart | null {

    console.log(`Rendering chart in #${containerId}`, dataPoints);

    const persons = Array.from(new Set(dataPoints.map((d) => d.person)));
    const serviceNames = Array.from(
        new Set(dataPoints.map((d) => d.serviceName)),
    );

    const datasets = serviceNames.map((serviceName, idx) => ({
        label: serviceName,
        data: persons.map(
            (p) =>
                dataPoints.find(
                    (d) => d.person === p && d.serviceName === serviceName,
                )?.count ?? 0,
        ),
        backgroundColor: chartColors[idx % chartColors.length],
    }));

    const ctx = document.getElementById(
        containerId,
    ) as HTMLCanvasElement | null;
    if (!ctx) {
        console.error(`No canvas found with id="${containerId}"`);
        return null;
    }

    // Destroy previous chart if it exists
    if (chartInstances[containerId]) {
        chartInstances[containerId].destroy();
    }

    // Create new chart
    const chart = new Chart(ctx, {
        type: "bar",
        data: { labels: persons, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true },
            },
        },
    });

    chartInstances[containerId] = chart;
    return chart;
}
