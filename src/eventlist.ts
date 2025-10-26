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
): void {
    const div = document.getElementById(divId);
    if (!div) {
        console.error(`No div found with id="${divId}"`);
        return;
    }

    // Clear previous content
    div.innerHTML = "";

    // Heading
    const heading = document.createElement("h2");
    heading.textContent = "EventList";
    div.appendChild(heading);

    events.forEach((event) => {
        // Event title
        const eventTitle = document.createElement("h2");
        eventTitle.className = "h5 mt-0";
        eventTitle.textContent = `${event.name} (${event.startDate} - ${event.endDate})`;
        div.appendChild(eventTitle);

        // Services list
        const ul = document.createElement("ul");
        ul.className = "list-unstyled mb-2 ps-3";

        const filteredServices =
            event.eventServices?.filter(
                (service) =>
                    service.serviceId != null &&
                    selectedServiceIds.includes(service.serviceId),
            ) ?? [];

        if (filteredServices.length > 0) {
            filteredServices.forEach((service) => {
                const li = document.createElement("li");
                li.className = "mb-1";
                const serviceName =
                    service.serviceId != null
                        ? servicesDict[String(service.serviceId)]?.name ?? "?"
                        : "?";
                li.textContent = `${serviceName} ${service.name ?? "?"}`;
                ul.appendChild(li);
            });
        } else {
            const li = document.createElement("li");
            li.textContent = "No services";
            ul.appendChild(li);
        }

        div.appendChild(ul);
    });
}

