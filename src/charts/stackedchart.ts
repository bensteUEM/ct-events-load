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

Chart.register(
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
);

export function renderStackedChart(
    containerId: string,
    dataPoints: DataPoint[],
) {
    console.log(`Rendering chart with DataPoints`, dataPoints);
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
        backgroundColor: `hsl(${(idx * 60) % 360}, 70%, 60%)`,
    }));

    const ctx = document.getElementById(containerId) as HTMLCanvasElement;
    new Chart(ctx, {
        type: "bar",
        data: { labels: persons, datasets },
        options: {
            responsive: true,
            scales: {
                x: { stacked: true },
                y: { stacked: true, beginAtZero: true },
            },
        },
    });
}
