import type { DataPoint } from "../charts/dtypes";
import type { Event, EventService } from "../utils/ct-types";

export type AggregationType = "SERVICE" | "EVENT";
/**
 * Count number of assignments per person
 * @param events - list of events
 * @param servicesDict - mapping of service ids to readable names
 * @param relevantServices - list of service ids to filter
 * @param minServicesCount: only include entries with more than x services,
 * @param aggregationType - aggregation by service or by event - only counting first service per person per event if EVENT
 * @returns Record<personId, Record<YYYY-MM, count>>
 */
export function countPerPerson(
    events: Event[],
    servicesDict: Record<number, EventService>,
    relevantServices: number[],
    minServicesCount: number = 1,
    aggregationType: AggregationType = "SERVICE",
): DataPoint[] {
    console.log("Filtering for services:", relevantServices);

    const dataPoints: DataPoint[] & { serviceName?: string }[] = [];

    events.forEach((event) => {
        if (!event.startDate) return;

        // Collect services per person for THIS event
        const servicesPerPerson = new Map<
            string,
            Array<{ serviceName: string; serviceId: number }>
        >();

        event.eventServices?.forEach((service) => {
            if (service.serviceId == null) return;
            if (!relevantServices.includes(service.serviceId)) return;

            const personName = service.name ?? "?";
            const serviceName = servicesDict[service.serviceId]?.name ?? "?";

            if (!servicesPerPerson.has(personName)) {
                servicesPerPerson.set(personName, []);
            }

            servicesPerPerson.get(personName)!.push({
                serviceName,
                serviceId: service.serviceId,
            });
        });

        // Now apply fractional weight per person in this event
        servicesPerPerson.forEach((services, personName) => {
            const weight = 1 / services.length;

            services.forEach(({ serviceName }) => {
                const existing = dataPoints.find(
                    (d) =>
                        d.person === personName &&
                        d.serviceName === serviceName,
                );

                const increment =
                    aggregationType === "EVENT" ? weight : 1;

                if (existing) {
                    existing.count += increment;
                } else {
                    dataPoints.push({
                        person: personName,
                        serviceName,
                        count: increment,
                    });
                }
            });
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
 * @param aggregationType - aggregation by service or by event - only counting first service per person per event if EVENT
 * @returns Record<personId, Record<YYYY-MM, count>>
 */
export function cummulativePersonTime(
    events: Event[],
    relevantServices: number[],
    minServicesCount: number = 1,
    aggregationType: AggregationType = "SERVICE",
): { person: string; count: number; date: string }[] {
    console.log("Filtering for services:", relevantServices);

    const dataPointsMap: Record<string, Record<string, number>> = {};
    // dataPointsMap[person][date] = count

    events.forEach((event) => {
        if (!event.startDate) return;
        const eventDate = event.startDate.slice(0, 10); // YYYY-MM-DD

        const serviceCountsPerPerson = new Map<string, number>();

        event.eventServices?.forEach((service) => {
            if (service.serviceId == null) return;
            if (!relevantServices.includes(service.serviceId)) return;

            const personName = service.name ?? "?";

            serviceCountsPerPerson.set(
                personName,
                (serviceCountsPerPerson.get(personName) ?? 0) + 1,
            );
        });

        // apply fractions -  AggregationType.EVENT
        event.eventServices?.forEach((service) => {
            if (service.serviceId == null) return;
            if (!relevantServices.includes(service.serviceId)) return;

            const personName = service.name ?? "?";

            const totalServices = serviceCountsPerPerson.get(personName) ?? 1;
            const increment =
                aggregationType === "EVENT"
                    ? 1 / totalServices
                    : 1;

            if (!dataPointsMap[personName]) dataPointsMap[personName] = {};
            if (!dataPointsMap[personName][eventDate])
                dataPointsMap[personName][eventDate] = 0;

            dataPointsMap[personName][eventDate] += increment;
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
