import type { DataPoint } from "../charts/dtypes";
import type { Event, Service } from "../utils/ct-types";
/**
 * Count number of services per service, per person per month
 * @param events - list of events
 * @param servicesDict - mapping of service ids to readable names
 * @param relevant_services - list of service ids to filter
 * @returns Record<personId, Record<YYYY-MM, count>>
 */
export function countServicesPerPerson(
    events: Event[],
    servicesDict: Record<number, Service>,
    relevant_services: number[],
): DataPoint[] {
    console.log("Filtering for services:", relevant_services);
    const dataPoints: DataPoint[] = [];
    events.forEach((event) => {
        // console.log("Processing event:", event);
        if (!event.startDate) return;
        const month = event.startDate.slice(0, 7); // optional, can include if needed
        event.eventServices?.forEach((service) => {
            if (!relevant_services.some((id) => id == service.serviceId))
                return;
            const personName = service.name ?? "?"; // or use event.person?.name if you have it
            // @ts-expect-error TS2538
            const serviceName = servicesDict[service.serviceId]?.name ?? "?";

            // check if this combination already exists in dataPoints
            const existing = dataPoints.find(
                (d) => d.person == personName && d.serviceName == serviceName,
            );

            if (existing) {
                existing.count++;
            } else {
                dataPoints.push({
                    person: personName,
                    serviceName,
                    count: 1,
                });
            }
        });
    });

    return dataPoints;
}
export function cummulativePersonTime(
    events: Event[],
    servicesDict: Record<number, Service>,
    relevant_services: number[],
): { person: string; count: number; date: string }[] {
    console.log("Filtering for services:", relevant_services);

    const dataPointsMap: Record<string, Record<string, number>> = {};
    // dataPointsMap[person][date] = count

    events.forEach((event) => {
        if (!event.startDate) return;
        const eventDate = event.startDate.slice(0, 10); // YYYY-MM-DD

        event.eventServices?.forEach((service) => {
            if (!relevant_services.includes(service.serviceId)) return;

            const personName = service.name ?? "?";

            if (!dataPointsMap[personName]) dataPointsMap[personName] = {};
            if (!dataPointsMap[personName][eventDate])
                dataPointsMap[personName][eventDate] = 0;

            dataPointsMap[personName][eventDate]++;
        });
    });

    // Flatten into DataPoint array
    const dataPoints: { person: string; count: number; date: string }[] = [];
    for (const person in dataPointsMap) {
        for (const date in dataPointsMap[person]) {
            dataPoints.push({
                person,
                count: dataPointsMap[person][date],
                date,
            });
        }
    }

    console.log("Flattened DataPoints:", dataPoints);
    return dataPoints;
}
