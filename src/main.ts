import type { Person, Event, Calendar, Service } from "./utils/ct-types";
import { churchtoolsClient } from "@churchtools/churchtools-client";

// only import reset.css in development mode to keep the production bundle small and to simulate CT environment
if (import.meta.env.MODE === "development") {
  import("./utils/reset.css");
}

declare const window: Window &
  typeof globalThis & {
    settings: {
      base_url?: string;
    };
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

/**
 * Fetch recent events from ChurchTools
 *
 * @returns array of Events
 */
async function fetchEvents() {
  // Fetch all events
  const now = new Date().toISOString();
  // Fetch events from calendar ID 2 starting from now
  const allEvents: Event[] = await churchtoolsClient.get(
    "/events?include=eventServices",
    {
      params: {
        from: now,
        limit: 5,
      },
    }
  );
  // console.log(allEvents)

  // Filter calendar and sort by startDate j
  const calendar2Events = allEvents.filter((event) => {
    return event.calendar?.domainIdentifier == 2;
  });
  calendar2Events.sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );
  const events = calendar2Events.slice(0, 10);
  console.log(events);

  return events;
}

/**
 * Fetch fetchServicesDict
 *
 * @param a - The first number
 * @param b - The second number
 * @returns dict of serviceId and ServiceObject
 */
async function fetchServicesDict() {
  // Fetch all services
  const services: Service[] = await churchtoolsClient.get("/services");
  const servicesDict: Record<number, Service> = services.reduce(
    (acc, service) => {
      acc[service.id] = service;
      return acc;
    },
    {} as Record<number, Service>
  );

  console.log(servicesDict);
  return servicesDict;
}

/**
 * Console printout for debugging shows each event and service with names
 *
 * @param events - list of events
 * @param services - mapping of service ids to readable names
 * @returns dict of serviceId and ServiceObject
 */
async function printEventServices(
  events: Event[],
  services: Record<number, Service[]>
) {
  // Print nicely
  events.forEach((event) => {
    console.log(`Event: ${event.name} (${event.startDate} - ${event.endDate})`);
    if (event.eventServices && event.eventServices.length > 0) {
      event.eventServices.forEach((service) => {
        console.log(`${services[service.serviceId].name} ${service.name}`);
      });
    } else {
      console.log("  No services for this event.");
    }
    console.log("-------------------------------------");
  });
}

/**
 * Main function executed by the plugin
 * updates respective HTML defined in index.html
 */
async function main() {
  const events = (await fetchEvents()) ?? [];
  const servicesDict = (await fetchServicesDict()) ?? [];
  console.log(servicesDict);
  printEventServices(events, servicesDict);

  document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
        <div id="welcome" ><h1>Welcome ${[user.firstName, user.lastName].join(
          " "
        )}</h1></div>

        <div id="events">
          ${events
            .map(
              (event) => `
            <h2>${event.name} (${event.startDate} - ${event.endDate})</h2>
            <ul>
${
  event.eventServices
    ?.map(
      (service) => `
  <li>${servicesDict[service.serviceId]?.name ?? "?"} ${
        service.name ?? "?"
      }</li>
`
    )
    .join("") ?? "<li>No services</li>"
}
            </ul>
          `
            )
            .join("")}
        </div>
      </div>
    `;
}

main();
