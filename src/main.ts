import type { Person, Event, Service } from "./utils/ct-types";
import { churchtoolsClient } from "@churchtools/churchtools-client";
import { countServicesPerPerson, cummulativePersonTime } from "./math/counts";

import { createChartsHTML } from "./charts/charts.ts";
import { renderStackedChart } from "./charts/stackedchart";
import { renderLineChart } from "./charts/linechart";

import {
    createFilterHTML,
    resetFilterOptions,
    saveFilterOptions,
    parseSelectedFilterOptions,
} from "./filters";
import { updateEventListHTML } from "./eventlist";
// only import reset.css in development mode
if (import.meta.env.MODE === "development") {
    import("./utils/reset.css");
}

declare const window: Window &
    typeof globalThis & {
        settings: { base_url?: string };
    };

const baseUrl = window.settings?.base_url ?? import.meta.env.VITE_BASE_URL;
churchtoolsClient.setBaseUrl(baseUrl);

const username = import.meta.env.VITE_USERNAME;
const password = import.meta.env.VITE_PASSWORD;
if (import.meta.env.MODE === "development" && username && password) {
    await churchtoolsClient.post("/login", { username, password });
}

const KEY = import.meta.env.VITE_KEY;
export { KEY };

/* end of initializiation */

const user = await churchtoolsClient.get<Person>(`/whoami`);

/** Fetch events in relevant timeframe from ChurchTools
 * @param relevantCalendars - list of calendar ids to filter
 * @param fromDate - start date to filter events
 * @param toDate - end date to filter events
 * @returns list of filtered events
 */
async function getEvents(
    relevantCalendars: number[],
    fromDate: Date = new Date(),
    toDate: Date = new Date(new Date().setMonth(new Date().getMonth() + 6)),
): Promise<Event[]> {
    console.log("Fetching events for calendars:", relevantCalendars);
    // Fetch all events
    const allEvents: Event[] = await churchtoolsClient.get("/events", {
        from: fromDate.toISOString().split("T")[0],
        to: toDate.toISOString().split("T")[0],
        include: "eventServices",
    });

    // Filter calendar and daterange sort by startDate j
    const calendarEvents = allEvents.filter((event) => {
        if (!event.startDate) return;
        const eventDate = new Date(event.startDate);
        return (
            relevantCalendars.some(
                // @ts-expect-error TS2339
                (id) => id == event?.calendar?.domainIdentifier,
            ) &&
            eventDate >= fromDate &&
            eventDate <= toDate
        );
    });

    console.log("Events:", calendarEvents);

    return calendarEvents;
}

/**
 * Fetch fetchServicesDict
 *
 * @returns dict of serviceId and ServiceObject
 */ async function getServicesDict(): Promise<Record<number, Service>> {
    const services: Service[] = await churchtoolsClient.get("/services");
    const servicesDict = Object.fromEntries(
        services
            .filter((service) => service.id != null)
            .map((service) => [service.id!, service]),
    ) as Record<number, Service>;
    return servicesDict;
}

/**
 * Wrapper to apply new filter options
 * @returns void
 */
async function submitFilterOptions(document: Document = window.document) {
    /* retrieve filter option selectedCalendars from HTML form */
    const selectedFilters = await parseSelectedFilterOptions(document);

    // data gathering
    const events = await getEvents(
        selectedFilters.calendars,
        selectedFilters.fromDate,
        selectedFilters.toDate,
    );
    const servicesDict = await getServicesDict();
    //   console.log(servicesDict);
    //   printServices(events, servicesDict, relevantServices);

    const dpCountServicesPerPerson = countServicesPerPerson(
        events,
        servicesDict,
        selectedFilters.services,
        selectedFilters.minServicesCount,
    );

    const dpCummulativePersontTime = cummulativePersonTime(
        events,
        selectedFilters.services,
        selectedFilters.minServicesCount,
    );

    // Insert the charts DOM element into the placeholder
    const chartsHTML = createChartsHTML();
    const chartsWrapper =
        document.querySelector<HTMLDivElement>("#chartsWrapper")!;
    chartsWrapper.innerHTML = "";
    chartsWrapper.append(chartsHTML);

    renderStackedChart("CountServicesPerPerson", dpCountServicesPerPerson);
    renderLineChart("CummulativePersontTime", dpCummulativePersontTime);

    updateEventListHTML(
        "eventListWrapper",
        events,
        servicesDict,
        selectedFilters.services,
    );
}

function setupButtonHandler(buttonId: string, handler: () => void) {
    const button = document.getElementById(buttonId);
    if (!button) {
        console.error(`Button #${buttonId} not found!`);
        return;
    }
    // Remove any previous listener to avoid duplicates
    button.replaceWith(button.cloneNode(true));
    const newButton = document.getElementById(buttonId) as HTMLButtonElement;
    newButton.addEventListener("click", handler);
}

/* add ChurchTools specific styles - required in dev only*/
async function addCtDevStyles() {
    if (import.meta.env.MODE === "development") {
        const cssFiles = ["/ccm/ct-events-load/20251026_ct_styles.css"];

        cssFiles.forEach((file) => {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `${file}`;
            link.type = "text/css";
            document.head.appendChild(link);
        });
    }
}

/** Main plugin function */
async function main() {
    /* HTML Updates */
    //addBootstrapStyles();
    addCtDevStyles();

    const app = document.querySelector<HTMLDivElement>("#app")!;
    app.innerHTML = `
<div class="container d-flex flex-column align-items-center justify-content-start min-vh-100 gap-3">
    <div class="container-fluid" id="filterWrapper"></div>
    <div class="container my-4 row" id="chartsWrapper"></div>
    <div class="container my-4 w-100" id="eventListWrapper"></div>
</div>
`;

    // Conditionally add dev-only welcome section
    if (import.meta.env.MODE === "development") {
        const devHeader = document.createElement("div");
        devHeader.className = "p-4 mb-4 bg-light rounded shadow text-center";

        const h1 = document.createElement("h1");
        h1.className = "display-5";
        h1.textContent = `Welcome ${user.firstName} ${user.lastName}`;

        const subDiv = document.createElement("div");
        subDiv.className = "text-muted small";
        subDiv.textContent = `ChurchTools at ${baseUrl}`;

        devHeader.appendChild(h1);
        devHeader.appendChild(subDiv);

        // Insert at the top of the container
        const container = app.querySelector(".container")!;
        container.insertBefore(devHeader, container.firstChild);
    }

    // Insert the filter DOM element into the placeholder
    const filterHTML = createFilterHTML();
    const filterWrapper =
        document.querySelector<HTMLDivElement>("#filterWrapper")!;
    filterWrapper.innerHTML = "";
    filterWrapper.appendChild(filterHTML);

    // additional setup links
    setupButtonHandler("resetFilterBtn", () => resetFilterOptions());
    setupButtonHandler("saveFilterBtn", () => saveFilterOptions(document));
    setupButtonHandler("submitFilterBtn", () => submitFilterOptions());
    resetFilterOptions();
}

main();
