/* HTML used to display event list */
import type { Event, Service } from "./utils/ct-types";

/** Create HTML for event list
 * @param divId - ID of the div which should be get the eventList content
 * @param events - list of events to display
 * @param servicesDict - dictionary of services by service ID
 * @param selectedServiceIds - list of service IDs to include
 */
export function updateEventListHTML(
    divId: string = "eventList",
    events: Event[] = [],
    servicesDict: Record<string, Service> = {},
    selectedServiceIds: number[] = [],
) {
    const div = document.getElementById(divId);
    if (!div) {
        console.error(`No div found with id="${divId}"`);
        return "";
    }
    div.innerHTML = `
        ${events
            .map(
                (event: Event) => `
                <h2 class="h5 mt-0">${event.name} (${event.startDate} - ${event.endDate})</h2>
                <ul class="list-unstyled mb-2 ps-3">
                ${
                    event.eventServices
                        ?.filter((service) =>
                            service.serviceId != null &&
                            selectedServiceIds.includes(service.serviceId),
                        )
                        .map(
                            (service) =>
                                `<li class="mb-1">${
                                    service.serviceId != null
                                        ? (servicesDict[String(service.serviceId)]?.name ?? "?")
                                        : "?"
                                } ${service.name ?? "?"}</li>`,
                        )
                        .join("") ?? "<li>No services</li>"
                }
                </ul>
            `,
            )
            .join("")}`;
}
