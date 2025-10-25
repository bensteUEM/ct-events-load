/* This module includes everything related to the filter options */
import { getWritebleServicegroupIds } from "./permissions";
import { getFilters, setFilters, updateFilters } from "./persistance";
import type { Calendar, Service, ServiceGroup } from "./utils/ct-types";
import { churchtoolsClient } from "@churchtools/churchtools-client";

/**
 * Wrapper to reset all filter options.
 * Tries to retrieve user config for store selected options and set them if not available
 * @returns void
 */
export async function resetFilterOptions() {
    let selectedFilters = await getFilters();
    if (!selectedFilters) {
        const defaultFilter = {
            calendars: [2],
            services: [6, 69, 72],
            months: 6,
            minServicesCount: 5,
        };
        setFilters(defaultFilter);
        selectedFilters = await getFilters();
    } else {
        console.log("Using stored filters:", selectedFilters);
    }

    refreshAvailableCalendars(selectedFilters?.calendars ?? []);
    refreshAvailableServices(selectedFilters?.services ?? []);
    initDateOptions(selectedFilters?.months ?? 6);
    initMinServicesOptions(selectedFilters?.minServicesCount ?? 5);
}

/**
 * Wrapper to save all filter options
 * @param document - the HTML reference to parse from
 * @returns void
 */
export async function saveFilterOptions(document: Document) {
    const selectedFilters = await parseSelectedFilterOptions(document);

    const storeableFilters = {
        calendars: selectedFilters.calendars,
        services: selectedFilters.services,
        months: diffInMonths(selectedFilters.fromDate, selectedFilters.toDate),
        minServicesCount: selectedFilters.minServicesCount,
    };

    if (await getFilters()) {
        updateFilters(storeableFilters);
    } else {
        setFilters(storeableFilters);
    }
}

function diffInMonths(date1: Date, date2: Date): number {
    const years = date2.getFullYear() - date1.getFullYear();
    const months = date2.getMonth() - date1.getMonth();
    let result = years * 12 + months + 1;

    if (date2.getDate() < date1.getDate()) {
        result -= 1;
    }

    return result;
}

/**
 * Parse selected filter options from HTML form
 * @param document - the HTML reference to parse from
 */
export async function parseSelectedFilterOptions(document: Document): Promise<{
    calendars: number[];
    services: number[];
    fromDate: Date;
    toDate: Date;
    minServicesCount: number;
}> {
    /* retrieve filter option selected_calendars from HTML form */
    const selectCalendars = document.getElementById(
        "selected_calendars",
    ) as HTMLSelectElement;
    const selected_calendars = Array.from(selectCalendars.selectedOptions).map(
        (option) => Number(option.value),
    );
    console.log("Selected calendars:", selected_calendars);

    /* retrieve filter option selected_services from HTML form */
    const selectServices = document.getElementById(
        "selected_service_types",
    ) as HTMLSelectElement;
    const selectedServiceIds: number[] = Array.from(
        selectServices.selectedOptions,
    ).map((option) => Number(option.value));

    console.log("Selected services:", selectedServiceIds);
    //Filter options based on allowed servicegroups

    const allowedServiceGroupIds = await getWritebleServicegroupIds();
    console.log("Allowed service group IDs:", allowedServiceGroupIds);
    // TODO@bensteUEM: https://github.com/bensteUEM/ct-events-load/issues/1

    /* retrieve filter options from HTML form */
    const inputFrom = document.getElementById("from_date") as HTMLInputElement;
    const fromDate = new Date(inputFrom.value);

    const inputTo = document.getElementById("to_date") as HTMLInputElement;
    const toDate = new Date(inputTo.value);

    console.log("Selected date range:", fromDate, toDate);

    const minServicesCountInput = document.getElementById(
        "min_services_count",
    ) as HTMLInputElement;
    const minServicesCount = Number(minServicesCountInput.value);

    console.log("Selected minServicesCount:", minServicesCount);

    const result = {
        calendars: selected_calendars,
        services: selectedServiceIds,
        fromDate: fromDate,
        toDate: toDate,
        minServicesCount: minServicesCount,
    };
    return result;
}

/**
 * Retrieve list of available calendars and populate the filter including default selections
 *
 * @param selectedCalendars - list of ids that should be selected upon init
 * @returns void
 */
async function refreshAvailableCalendars(selectedCalendars: number[] = []) {
    console.log(
        "Refreshing available calendars with selected calendars:",
        selectedCalendars,
    );

    const allCalendars: Calendar[] = await churchtoolsClient.get("/calendars");
    console.log("Available calendars:", allCalendars);

    const selectEl = document.getElementById(
        "selected_calendars",
    ) as HTMLSelectElement;
    if (!selectEl) return;

    // Clear existing options
    selectEl.innerHTML = "";

    allCalendars.forEach((calendar) => {
        const option: HTMLOptionElement = document.createElement("option");
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
 * @param selectedServices - list of ids that should be selected upon init
 * @returns void
 */
async function refreshAvailableServices(selectedServices: number[] = []) {
    console.log(
        "Refreshing available services for filter options with selected services:",
        selectedServices,
    );

    const allServiceGroups: ServiceGroup[] =
        await churchtoolsClient.get("/servicegroups");

    const availableServicegroups = Object.fromEntries(
        allServiceGroups
            .filter((group) => group.id != null) // skip undefined IDs
            .map((group) => [group.id, group.name]),
    ) as Record<number, string>;
    console.log("Available serviceGroups:", availableServicegroups);

    const allowedServiceGroupIds = await getWritebleServicegroupIds();

    const allServices: Service[] = await churchtoolsClient.get("/services");
    console.log("Available services:", allServices);

    const available_service_types_by_category: Record<
        number,
        { id: number; name: string }[]
    > = allServices.reduce<Record<number, { id: number; name: string }[]>>(
        (acc, service) => {
            const groupId = service.serviceGroupId;
            if (groupId == null) return acc; // skip if undefined or null
            if (!allowedServiceGroupIds.includes(service.serviceGroupId)) {
                return acc;
            }
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
        optgroup.label = availableServicegroups[Number(categoryId)] ?? "";

        available_service_types_by_category[Number(categoryId)].forEach(
            (service) => {
                const option = document.createElement("option");
                option.value = service.id.toString();
                option.textContent = service.name;

                if (selectedServices.includes(service.id)) {
                    option.selected = true;
                }

                optgroup.appendChild(option);
            },
        );
        selectElement.appendChild(optgroup);
    }
}

/**
 * Initialize date options with default values based on NOW() and defaultTimeFrameMonths
 *
 * @param moths - number of months for default timeframe
 * @returns void
 */
function initDateOptions(months = 6) {
    console.log("init date options with now +", months, " months");

    const fromDateInput = document.getElementById(
        "from_date",
    ) as HTMLInputElement;
    const toDateInput = document.getElementById("to_date") as HTMLInputElement;

    // Start: today at 00:00
    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);

    // End: fromDate + 6 months, at 23:59:59
    const toDate = new Date(fromDate);
    toDate.setMonth(toDate.getMonth() + months);
    toDate.setHours(23, 59, 59, 999);

    console.log("From:", fromDate, "To:", toDate);

    fromDateInput.value = fromDate.toISOString().slice(0, 10);
    toDateInput.value = toDate.toISOString().slice(0, 10);
}

function initMinServicesOptions(selectedFilters = 5) {
    const minServicesCountInput = document.getElementById(
        "min_services_count",
    ) as HTMLInputElement;

    minServicesCountInput.value = selectedFilters.toString();
}
/* HTML used to display filter options 
content needs to be populated dynamically
*/
export function createFilterHTML(): string {
    return `<form id="filters" class="form-floating mb-3">
                <h2>Filterung</h2>
                <div class="row g-3 mb-3">
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
                </div>
                <button type="button" id="submitFilterBtn" class="btn btn-primary">Auswahl anpassen</button>
                <button type="button" id="saveFilterBtn" class="btn btn-secondary">Save Filter as Default</button>
                <button type="button" id="resetFilterBtn" class="btn btn-secondary">Reload Filter Options</button>
                </form>
                `;
}
