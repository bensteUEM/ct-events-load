import { Chart } from "chart.js";

/**
 * Create DIV element with respective children used for charts 
 * @returns HTML div element which can be inserted
 */
export function createChartsHTML(): HTMLDivElement {
    const container = document.createElement("div");
    container.className = "flex flex-col gap-4";

    // Heading
    const heading = document.createElement("h2");
    heading.textContent = "Charts";
    heading.className = "text-body-l-emphasized m-0 grow mb-4";
    container.appendChild(heading);

    // Charts row container
    const chartsRow = document.createElement("div");
    chartsRow.className = "flex flex-wrap justify-center w-full";

    // First chart
    const chart1Col = document.createElement("div");
    chart1Col.className = "flex min-w-full image-content";

    const chart1 = document.createElement("canvas");
    chart1.className = "image";
    chart1.id = "CountServicesPerPerson";
    chart1Col.appendChild(chart1);

    // Second chart
    const chart2Col = document.createElement("div");
    chart2Col.className = "flex min-w-full image-content";

    const chart2 = document.createElement("canvas");
    chart2.className = "image";
    chart2.id = "CummulativePersontTime";
    chart2Col.appendChild(chart2);

    // Append chart columns to row
    chartsRow.appendChild(chart1Col);
    chartsRow.appendChild(chart2Col);

    // Append row to container
    container.appendChild(chartsRow);

    return container;
}

/**
 * Commpute colors based on CT CSS classes used on groups page
  @returns list of color definitions parsed from names in CSS
 */
export function getCTChartColors(): string[] {
    const colorNames = [
        "--color-yellow-b-bright",
        "--color-cyan-b-bright",
        "--color-emerald-b-bright",
        "--color-pink-b-bright",
        "--color-orange-b-bright",
        "--color-blue-b-bright",
        "--color-teal-b-bright",
        "--color-purple-b-bright",
        "--color-gray-b-bright",
        "--color-lime-b-bright",
        "--color-amber-b-bright",
        "--color-rose-b-bright",
        "--color-yellow-b-contrast",
        "--color-cyan-b-contrast",
        "--color-emerald-b-contrast",
        "--color-pink-b-contrast",
        "--color-blue-b-contrast",
        "--color-teal-b-contrast",
        "--color-orange-b-contrast",
        "--color-purple-b-contrast",
        "--color-gray-b-contrast",
        "--color-lime-b-contrast",
        "--color-amber-b-contrast",
        "--color-rose-b-contrast",
    ];

    // Get computed values
    const chartColors = colorNames.map((name) =>
        cssVar(name),
    );
    console.log("using colors from css: ", chartColors);
    return chartColors;
}

/**
 * Extract CSS variables for script usage
 * @param name of the variable
 * @returns property value
 */
function cssVar(name: string): string {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
}

/**
 * set defaults for chart styling
 * @param canvasElement which should be styles
 */
export function applyThemeToChart(): void {
    Chart.defaults.font.family = cssVar("--font-sans") || "Lato, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = cssVar("--color-gray-800");
    Chart.defaults.borderColor = cssVar("--color-gray-300");
}

applyThemeToChart();
