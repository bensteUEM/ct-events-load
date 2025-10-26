import type { Person, Event, Service } from "./utils/ct-types";
import { churchtoolsClient } from "@churchtools/churchtools-client";
import { countServicesPerPerson, cummulativePersonTime } from "./math/counts";

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

    renderStackedChart("CountServicesPerPerson", dpCountServicesPerPerson);
    renderLineChart("CummulativePersontTime", dpCummulativePersontTime);

    updateEventListHTML(
        "eventList",
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

/** add bootstrap styles */
async function addBootstrapStyles() {
    // Add CSS
    const bootstrapCss = document.createElement("link");
    bootstrapCss.rel = "stylesheet";
    bootstrapCss.href =
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css";
    document.head.appendChild(bootstrapCss);

    // Add JS
    const bootstrapJs = document.createElement("script");
    bootstrapJs.src =
        "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js";
    document.head.appendChild(bootstrapJs);
}

/** Main plugin function */
async function main() {
    const filterHTML = createFilterHTML();

    /* HTML Updates */

    document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div class="container d-flex flex-column align-items-center justify-content-start min-vh-100 gap-3">
        <div class="p-4 mb-4 bg-light rounded shadow text-center">
            <h1 class="display-5">Welcome ${user.firstName} ${user.lastName}</h1>
            <div id="test" class="text-muted small">ChurchTools at ${baseUrl}</div>
        </div>
        <div class="container-fluid">
            ${filterHTML}
        </div>
        <div class="container my-4">
            <div class="row g-4 justify-content-center">
                <div class="col-lg-6 col-md-12 d-flex justify-content-center">
                    <canvas id="CountServicesPerPerson" class="w-400" height="400"></canvas>
                </div>
                <div class="col-lg-6 col-md-12 d-flex justify-content-center">
                    <canvas id="CummulativePersontTime" class="w-400" height="400"></canvas>
                </div>
            </div>
        </div>
        <div id="eventList" class="container my-4 w-100"></div>
    </div>
    </div>
`;
    addBootstrapStyles();

    setupButtonHandler("resetFilterBtn", () => resetFilterOptions());
    setupButtonHandler("saveFilterBtn", () => saveFilterOptions(document));
    setupButtonHandler("submitFilterBtn", () => submitFilterOptions());
    resetFilterOptions();
}

main();
