import type { Person, Event, Calendar, Service } from "./utils/ct-types";
import { churchtoolsClient } from "@churchtools/churchtools-client";

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

/** Fetch recent events from ChurchTools
 * @param relevant_calendars - list of calendar ids to filter
 * @param fromDate - start date to filter events
 * @param toDate - end date to filter events
 * @returns list of filtered events
 */
async function fetchEvents(
    relevant_calendars: number[],
    fromDate: Date,
    toDate: Date,
): Promise<Event[]> {
    console.log("Fetching events for calendars:", relevant_calendars);
    // Fetch all events
    const now = new Date().toISOString();
    // Fetch events from calendar ID 2 starting from now
    const allEvents: Event[] = await churchtoolsClient.get(
        "/events?include=eventServices",
        {
            params: {}, //TODO params are ignored ...???
        },
    );

    // Filter calendar and daterange sort by startDate j
    const calendarEvents = allEvents.filter((event) => {
        if (!event.startDate) return;
        const eventDate = new Date(event.startDate);
        return (
            relevant_calendars.some(
                // @ts-expect-error TS2339
                (id) => id == event?.calendar?.domainIdentifier,
            ) &&
            eventDate >= fromDate &&
            eventDate <= toDate
        );
    });

    // calendarEvents.sort(
    //     (a, b) =>
    //         new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    // );
    // const events = calendarEvents.slice(0, 10);

    console.log("Events:", calendarEvents);

    return calendarEvents;
}

/**
 * Fetch fetchServicesDict
 *
 * @returns dict of serviceId and ServiceObject
 */ async function fetchServicesDict(): Promise<Record<number, Service>> {
    const services: Service[] = await churchtoolsClient.get("/services");
    return services.reduce(
        (acc, service) => {
            acc[service.id] = service;
            return acc;
        },
        {} as Record<number, Service>,
    );
}

/**
 * Console printout for debugging shows each event and service with names
 *
 * @param events - list of events
 * @param servicesDict - mapping of service ids to readable names
 * @param relevant_services - list of service ids to filter

 * @returns dict of serviceId and ServiceObject
 */
async function printEventServices(
    events: Event[],
    servicesDict: Record<number, Service[]>,
    relevant_services: number[],
) {
    // Print nicely
    events.forEach((event) => {
        console.log(
            `Event: ${event.name} (${event.startDate} - ${event.endDate})`,
        );
        if (event.eventServices && event.eventServices.length > 0) {
            event.eventServices.forEach((service) => {
                if (!relevant_services.some((id) => id == service.serviceId))
                    return;
                console.log(
                    `${servicesDict[service.serviceId].name} ${service.name}`,
                );
            });
        } else {
            console.log("  No services for this event.");
        }
        console.log("-------------------------------------");
    });
}
import { countServicesPerPerson, cummulativePersonTime } from "./math/counts";

import { renderStackedChart } from "./charts/stackedchart";
import { renderLineChart } from "./charts/linechart";

import { resetFilterOptions } from "./filters";

/**
 * Wrapper to apply new filter options
 * @returns void
 */
async function submitFilterOptions() {
    console.log("Applying new filter options...");
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

/** Main plugin function */
async function main() {
    // Configuration
    const selected_calendars = [2]; // on ELKW1610.krz.tools this is "Gottesdienste"
    const selected_services = [6, 57, 69, 72, 104]; // ELKW1610.krz.tools these are all tech services
    const fromDate = new Date(); // today
    const toDate = new Date();
    toDate.setMonth(toDate.getMonth() + 6); // add 6 months

    // data gathering
    const events = await fetchEvents(selected_calendars, fromDate, toDate);
    const servicesDict = await fetchServicesDict();
    //   console.log(servicesDict);
    //   printEventServices(events, servicesDict, relevant_services);

    const dpCountServicesPerPerson = countServicesPerPerson(
        events,
        servicesDict,
        selected_services,
    );

    const dpCummulativePersontTime = cummulativePersonTime(
        events,
        servicesDict,
        selected_services,
    );

    /* HTML Updates */

    document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; min-height: 100vh; gap: 20px;">
        <div id="welcome">
            <h1>Welcome ${user.firstName} ${user.lastName}</h1>
            <div id="test">ChurchTools at ${baseUrl}</div>
            <button type="button" id="resetFilterBtn">Refresh available Filter Options</button>
        </div>
        <div class="container-fluid">
            <form id="filters" class="form-floating mb-3">
            <h2>Filterung</h2>
            <div class="col-auto">
                <label for="selected_calendars" class="form-label">Kalender</label>
                <select class="form-select" multiple aria-label="multiple select" id="selected_calendars"
                    size="10" name="selected_calendars">
                    <!-- Options will be populated dynamically -->
                </select>
            </div>
            <div class="col-auto">
                <div class="row">
                    <label for="from_date" class="form-label">Von</label>
                    <input type="date" id="from_date" class="form-control" name="from_date"
                        value="{{ from_date.strftime('%Y-%m-%d') }}">
                </div>
                <div class="row">
                    <label for="to_date" class="form-label">Bis</label>
                    <input type="date" id="to_date" class="form-control" name="to_date"
                        value="{{ to_date.strftime('%Y-%m-%d') }}">
                </div>
                <div class="row">
                    <label for="min_services_count" class="form-label">Mindestens # Dienste</label>
                    <input type="number" id="min_services_count" class="form-control" name="min_services_count"
                        value="{{ min_services_count }}">
                </div>
            </div>
            <div class="col-auto">
                <label for="selected_service_types" class="form-label">Dienste</label>
                <select class="form-select" multiple aria-label="multiple select" size="10"
                    name="selected_service_types" id="selected_service_types">
                    <!-- Options will be populated dynamically -->
                </select>
            </div>
            <button type="button" id="submitFilterBtn" class="btn btn-primary">Auswahl anpassen</button>
            </form>
        </div>

        <div id="events">
        ${events
            .map(
                (event) => `
                <h2>${event.name} (${event.startDate} - ${event.endDate})</h2>
                <ul>
                ${
                    event.eventServices
                        ?.map(
                            (service: Service) =>
                                `<li>${
                                    servicesDict[service.serviceId]?.name ?? "?"
                                } ${service.name ?? "?"}</li>`,
                        )
                        .join("") ?? "<li>No services</li>"
                }
                </ul>
            `,
            )
            .join("")}
        </div>
        <div id="charts_container">
        <div id="chart1">
        <canvas id="CountServicesPerPerson" width="800" height="400"></canvas>
        </div>
        <div id="chart2">
        <canvas id="CummulativePersontTime" width="800" height="400"></canvas>
        </div>
    </div>
    </div>
`;
    renderStackedChart("CountServicesPerPerson", dpCountServicesPerPerson);
    renderLineChart("CummulativePersontTime", dpCummulativePersontTime);

    setupButtonHandler("resetFilterBtn", resetFilterOptions);
    setupButtonHandler("submitFilterBtn", submitFilterOptions);
    resetFilterOptions();
}

main();
