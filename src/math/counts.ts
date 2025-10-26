import type { DataPoint } from "../charts/dtypes";
import type { Event, EventService } from "../utils/ct-types";
/**
 * Count number of services per service, per person per month
 * @param events - list of events
 * @param servicesDict - mapping of service ids to readable names
 * @param relevantServices - list of service ids to filter
 * @param minServicesCount: only include entries with more than x services,
 * @returns Record<personId, Record<YYYY-MM, count>>
 */
export function countServicesPerPerson(
    events: Event[],
    servicesDict: Record<number, EventService>,
    relevantServices: number[],
    minServicesCount: number = 1,
): DataPoint[] {
    console.log("Filtering for services:", relevantServices);

    const dataPoints: DataPoint[] & { serviceName?: string }[] = [];

    events.forEach((event) => {
        // console.log("Processing event:", event);
        if (!event.startDate) return;
        event.eventServices?.forEach((service) => {
            if (service.serviceId == null) return;
            if (!relevantServices.includes(service.serviceId)) return;

            const personName = service.name ?? "?";
            const serviceName = servicesDict[service.serviceId]?.name ?? "?";

            // check if this combination already exists in dataPoints
            const existing = dataPoints.find(
                (d) => d.person === personName && d.serviceName === serviceName,
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

    // Compute total counts per person
    const totalCountsPerPerson: Record<string, number> = {};
    dataPoints.forEach((d) => {
        totalCountsPerPerson[d.person] =
            (totalCountsPerPerson[d.person] || 0) + d.count;
    });

    // Filter out all datapoints for persons below minServicesCount
    return dataPoints.filter(
        (d) => totalCountsPerPerson[d.person] >= minServicesCount,
    );
}

/**
 * cummulate number of services per person per event
 * @param events - list of events
 * @param relevantServices - list of service ids to filter
 * @param minServicesCount: only include entries with more than x services,
 * @returns Record<personId, Record<YYYY-MM, count>>
 */
export function cummulativePersonTime(
    events: Event[],
    relevantServices: number[],
    minServicesCount: number = 1,
): { person: string; count: number; date: string }[] {
    console.log("Filtering for services:", relevantServices);

    const dataPointsMap: Record<string, Record<string, number>> = {};
    // dataPointsMap[person][date] = count

    events.forEach((event) => {
        if (!event.startDate) return;
        const eventDate = event.startDate.slice(0, 10); // YYYY-MM-DD

        event.eventServices?.forEach((service) => {
            if (service.serviceId == null) return;
            if (!relevantServices.includes(service.serviceId)) return;

            const personName = service.name ?? "?";

            if (!dataPointsMap[personName]) dataPointsMap[personName] = {};
            if (!dataPointsMap[personName][eventDate])
                dataPointsMap[personName][eventDate] = 0;

            dataPointsMap[personName][eventDate]++;
        });
    });

    // Flatten into array, only for persons where max count exceeds minServicesCount
    const dataPoints: { person: string; count: number; date: string }[] = [];

    for (const person in dataPointsMap) {
        const totalCount = Object.values(dataPointsMap[person]).reduce(
            (sum, count) => sum + count,
            0,
        );
        if (totalCount < minServicesCount) continue; // skip this person

        for (const date in dataPointsMap[person]) {
            dataPoints.push({
                person,
                count: dataPointsMap[person][date],
                date,
            });
        }
    }

    console.log("Flattened and filtered DataPoints:", dataPoints);
    return dataPoints;
}
