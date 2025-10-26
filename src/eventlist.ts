/* HTML used to display event list */
import type { Event, Service, ZuluDate } from "./utils/ct-types";

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
    heading.className = "text-body-l-emphasized mb-4";
    div.appendChild(heading);

    // Container for all events
    const eventsContainer = document.createElement("div");
    eventsContainer.className = "flex flex-wrap gap-4";
    div.appendChild(eventsContainer);

    events.forEach((event) => {
        const eventCard = document.createElement("div");
        eventCard.className =
            "flex flex-col p-3 border rounded-sm shadow-sm w-64";
        
        // Event title
        const eventTitle = document.createElement("h3");
        eventTitle.className = "text-body-l-emphasized m-0 grow mb-2";
        eventTitle.textContent = event.name!;
        eventCard.appendChild(eventTitle);

        const eventTime = document.createElement("div");
        eventTime.innerHTML = formatZuluDE(event.startDate!);
        eventCard.appendChild(eventTime);

        // Services list
        const ul = document.createElement("ul");
        ul.className = "list-none pl-3 mb-0";
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
                        ? (servicesDict[String(service.serviceId)]?.name ?? "?")
                        : "?";
                li.textContent = `${serviceName} ${service.name ?? "?"}`;
                ul.appendChild(li);
            });
        } else {
            const li = document.createElement("li");
            li.textContent = "No services";
            ul.appendChild(li);
        }

        eventCard.appendChild(ul);
        eventsContainer.appendChild(eventCard);
    });
}

function formatZuluDE(zulu: ZuluDate): string {
    const date = new Date(zulu);

    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Europe/Berlin",
    };

    // Format as "DD.MM.YYYY, HH:mm"
    const formatted = new Intl.DateTimeFormat("de-DE", options).format(date);

    // Convert to "YYYY-MM-DD HH:mm"
    const [day, month, year, time] = formatted.replace(",", "").split(/[.\s]+/);

    return `${year}-${month}-${day} ${time}`;
}
