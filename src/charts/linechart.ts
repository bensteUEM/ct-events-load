import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    TimeScale,
    Tooltip,
    Legend,
} from "chart.js";

// Register once
Chart.register(
    LineController,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    TimeScale,
    Tooltip,
    Legend,
);

const chartInstances: Record<string, Chart> = {};

/**
 * Create a Line chart
 * @param containerId reference for canvas to use
 * @param dataPoints 
 * @param colors 
 * @returns 
 */
export function renderLineChart(
    containerId: string,
    dataPoints: { person: string; count: number; date: string }[],
    colors: string[], // Array of CSS colors or computed color strings
): Chart | null {
    console.log(`Rendering line chart in #${containerId}`, dataPoints);

    // Unique persons and sorted dates
    const persons = Array.from(new Set(dataPoints.map((d) => d.person)));
    const dates = Array.from(new Set(dataPoints.map((d) => d.date))).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    );

    // For each person, compute cumulative counts per date
    const datasets = persons.map((person, idx) => {
        let cumulative = 0;
        const data = dates.map((date) => {
            const countOnDate =
                dataPoints.find((d) => d.person === person && d.date === date)
                    ?.count ?? 0;
            cumulative += countOnDate;
            return cumulative;
        });

        return {
            label: person,
            data,
            fill: false,
            borderColor: colors[idx % colors.length],
            tension: 0.2, // smooth curves
        };
    });

    const ctx = document.getElementById(
        containerId,
    ) as HTMLCanvasElement | null;
    if (!ctx) {
        console.error(`No canvas found with id="${containerId}"`);
        return null;
    }

    // Destroy existing chart with same ID
    if (chartInstances[containerId]) {
        chartInstances[containerId].destroy();
    }

    const chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: dates,
            datasets,
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: "category",
                    title: { display: true, text: "Date" },
                },
                y: {
                    beginAtZero: true,
                    title: { display: true, text: "Cumulative Count" },
                },
            },
        },
    });

    chartInstances[containerId] = chart;
    return chart;
}
