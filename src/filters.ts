/* This module includes everything related to the filter options */
import type { Calendar, Service, ServiceGroup } from "./utils/ct-types";
import { churchtoolsClient } from "@churchtools/churchtools-client";

/**
 * Wrapper to reset all filter options
 * @returns void
 */
export async function resetFilterOptions() {
    refreshAvailableCalendars();
    refreshAvailableServices();
    initDateOptions();
    initMinServicesOptions();
}

/**
 * Retrieve list of available calendars and populate the filter including default selections
 *
 * @param selectedCalendars - list of ids that should be selected upon init
 * @returns void
 */
async function refreshAvailableCalendars(selectedCalendars: number[] = []) {
    const allCalendars: Calendar[] = await churchtoolsClient.get("/calendars");
    console.log("Available calendars:", allCalendars);

    const selectEl = document.getElementById(
        "selected_calendars",
    ) as HTMLSelectElement;
    if (!selectEl) return;

    // Clear existing options
    selectEl.innerHTML = "";

    allCalendars.forEach((calendar) => {
        const option = document.createElement("option");
        option.value = calendar.id.toString();
        option.textContent = calendar.name;
        if (selectedCalendars.includes(calendar.id)) {
            option.selected = true;
        }
        selectEl.appendChild(option);
    });
}

/**
 * Retrieve list of available services by servicegroup and populate the filter including default selections
 *
 * @param selected_service_types - list of ids that should be selected upon init
 * @returns void
 */
async function refreshAvailableServices(
    selected_service_types: number[] = [6, 69, 72],
) {
    const allServiceGroups: ServiceGroup[] =
        await churchtoolsClient.get("/servicegroups");

    const available_service_categories = allServiceGroups.reduce(
        (acc, group) => {
            acc[group.id] = group.name;
            return acc;
        },
        {} as Record<number, string>,
    );
    console.log("Available serviceGroups:", available_service_categories);

    const allServices: Service[] = await churchtoolsClient.get("/services");
    console.log("Available services:", allServices);

    // Group by serviceGroupId
    const available_service_types_by_category = allServices.reduce(
        (acc, service) => {
            const groupId = service.serviceGroupId;
            if (!acc[groupId]) acc[groupId] = [];
            acc[groupId].push({ id: service.id, name: service.nameTranslated });
            return acc;
        },
        {},
    );
    console.log(
        "Available ServiceGroups with Services:",
        available_service_types_by_category,
    );

    const selectElement = document.getElementById(
        "selected_service_types",
    ) as HTMLSelectElement;

    // Remove all existing children
    selectElement.innerHTML = "";

    for (const categoryId in available_service_types_by_category) {
        const optgroup = document.createElement("optgroup");
        optgroup.label = available_service_categories[Number(categoryId)] ?? "";

        available_service_types_by_category[Number(categoryId)].forEach(
            (service) => {
                const option = document.createElement("option");
                option.value = service.id.toString();
                option.textContent = service.name;

                if (selected_service_types.includes(service.id)) {
                    option.selected = true;
                }

                optgroup.appendChild(option);
            },
        );
        selectElement.appendChild(optgroup);
    }
}

function initDateOptions(DEFAULT_TIMEFRAME_MONTHS = 6) {
    const fromDateInput = document.getElementById(
        "from_date",
    ) as HTMLInputElement;
    const toDateInput = document.getElementById("to_date") as HTMLInputElement;

    // Start: today at 00:00
    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);

    // End: fromDate + 6 months, at 23:59:59
    const toDate = new Date(fromDate);
    toDate.setMonth(toDate.getMonth() + DEFAULT_TIMEFRAME_MONTHS);
    toDate.setHours(23, 59, 59, 999);

    console.log("From:", fromDate, "To:", toDate);

    fromDateInput.value = fromDate.toISOString().slice(0, 10);
    toDateInput.value = toDate.toISOString().slice(0, 10);
}

function initMinServicesOptions(MIN_SERVICES_COUNT = 5) {
    const minServicesCountInput = document.getElementById(
        "min_services_count",
    ) as HTMLInputElement;

    minServicesCountInput.value = MIN_SERVICES_COUNT.toString();
}
