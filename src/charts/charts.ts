/* Create DIV element with respective childs used for charts */
export function createChartsHTML(): HTMLDivElement {
    // Create container div
    const container = document.createElement("div");
    container.className = "row g-4 justify-content-center";

    // Heading
    const heading = document.createElement("h2");
    heading.textContent = "Charts";
    container.appendChild(heading);

    // First chart
    const chart1Col = document.createElement("div");
    chart1Col.className = "col-lg-6 col-md-12 d-flex justify-content-center";

    const chart1 = document.createElement("canvas");
    chart1.id = "CountServicesPerPerson";
    chart1.className = "w-400";
    chart1.height = 400;

    chart1Col.appendChild(chart1);

    // Second chart
    const chart2Col = document.createElement("div");
    chart2Col.className = "col-lg-6 col-md-12 d-flex justify-content-center";

    const chart2 = document.createElement("canvas");
    chart2.id = "CummulativePersontTime";
    chart2.className = "w-400";
    chart2.height = 400;

    chart2Col.append(chart2);

    container.appendChild(chart1Col);
    container.appendChild(chart2Col);

    return container;
}
