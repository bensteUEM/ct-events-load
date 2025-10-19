/* HTML used to display event list */
import type { Event, Service } from "./utils/ct-types";
export function createEventListHTML(events: Event[] = []): string {
    return `<div class="flex-fill overflow-auto p-3 border rounded" style="min-height: 40vh; max-height: 70vh;">
        ${events
            .map(
                (event: Event) => `
                <h2 class="h5 mt-0">${event.name} (${event.startDate} - ${event.endDate})</h2>
                <ul class="list-unstyled mb-2 ps-3">
                ${
                    event.eventServices
                        ?.map(
                            (service: Service) =>
                                `<li class="mb-1">${
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
                `;
}
