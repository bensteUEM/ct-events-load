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

    const available_service_categories = Object.fromEntries(
        allServiceGroups
            .filter((group) => group.id != null) // skip undefined IDs
            .map((group) => [group.id, group.name]),
    ) as Record<number, string>;
    console.log("Available serviceGroups:", available_service_categories);

    const allServices: Service[] = await churchtoolsClient.get("/services");
    console.log("Available services:", allServices);

    // Group by serviceGroupId
    const available_service_types_by_category: Record<
        number,
        { id: number; name: string }[]
    > = allServices.reduce(
        (acc, service) => {
            const groupId = service.serviceGroupId;
            if (groupId == null) return acc; // skip if undefined/null

            if (!acc[groupId]) acc[groupId] = [];
            acc[groupId].push({ id: service.id, name: service.nameTranslated });
            return acc;
        },
        {} as Record<number, { id: number; name: string }[]>,
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
                <button type="button" id="resetFilterBtn" class="btn btn-secondary">Refresh available Filter Options</button>
                </form>
                `;
}
