/* Create DIV element with respective children used for charts */
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
