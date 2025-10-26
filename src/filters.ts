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
        // this set of defaults only applies to ELKW1610.KRZ.TOOLS - but can be overwritten using save
        const defaultFilter = {
            calendars: [2],
            services: [6, 69, 72],
            days: 90,
            minServicesCount: 5,
        };
        setFilters(defaultFilter);
        selectedFilters = defaultFilter;
        console.log("Initialized and saved default filters:", selectedFilters);
    } else {
        console.log("Using stored filters:", selectedFilters);
    }

    refreshAvailableCalendars(selectedFilters?.calendars ?? []);
    refreshAvailableServices(selectedFilters?.services ?? []);
    initDateOptions(selectedFilters?.days ?? 90);
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
        days:
            (selectedFilters.toDate.getTime() -
                selectedFilters.fromDate.getTime()) /
            (1000 * 60 * 60 * 24), //convert from miliseconds
        minServicesCount: selectedFilters.minServicesCount,
    };

    if (await getFilters()) {
        updateFilters(storeableFilters);
    } else {
        setFilters(storeableFilters);
    }
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
    /* retrieve filter option selectedCalendars from HTML form */
    const selectCalendars = document.getElementById(
        "selectedCalendars",
    ) as HTMLSelectElement;
    const selectedCalendars = Array.from(selectCalendars.selectedOptions).map(
        (option) => Number(option.value),
    );
    console.log("Selected calendars:", selectedCalendars);

    /* retrieve filter option selectedServices from HTML form */
    const selectServices = document.getElementById(
        "selectedServices",
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
    const inputFrom = document.getElementById("fromDate") as HTMLInputElement;
    const fromDate = new Date(inputFrom.value);

    const inputTo = document.getElementById("toDate") as HTMLInputElement;
    const toDate = new Date(inputTo.value);

    console.log("Selected date range:", fromDate, toDate);

    const minServicesCountInput = document.getElementById(
        "minServicesCount",
    ) as HTMLInputElement;
    const minServicesCount = Number(minServicesCountInput.value);

    console.log("Selected minServicesCount:", minServicesCount);

    const result = {
        calendars: selectedCalendars,
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
        "selectedCalendars",
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

    const availableServicesByCategory: Record<
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
        availableServicesByCategory,
    );

    const selectElement = document.getElementById(
        "selectedServices",
    ) as HTMLSelectElement;

    // Remove all existing children
    selectElement.innerHTML = "";

    for (const categoryId in availableServicesByCategory) {
        const optgroup = document.createElement("optgroup");
        optgroup.label = availableServicegroups[Number(categoryId)] ?? "";

        availableServicesByCategory[Number(categoryId)].forEach((service) => {
            const option = document.createElement("option");
            option.value = service.id.toString();
            option.textContent = service.name;

            if (selectedServices.includes(service.id)) {
                option.selected = true;
            }

            optgroup.appendChild(option);
        });
        selectElement.appendChild(optgroup);
    }
}

/**
 * Initialize date options with default values based on NOW() and defaultTimeFrameMonths
 *
 * @param days - number of days for default timeframe
 * @returns void
 */
function initDateOptions(days = 90) {
    console.log("init date options with now +", days, " days");

    const fromDateInput = document.getElementById(
        "fromDate",
    ) as HTMLInputElement;
    const toDateInput = document.getElementById("toDate") as HTMLInputElement;

    // Start: today at 00:00
    const fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);

    // End: fromDate + 6 days, at 23:59:59
    const toDate = new Date(fromDate);
    toDate.setDate(toDate.getDate() + days);

    console.log("From:", fromDate, "To:", toDate);

    fromDateInput.value = fromDate.toISOString().slice(0, 10);
    toDateInput.value = toDate.toISOString().slice(0, 10);
}

function initMinServicesOptions(selectedFilters = 5) {
    const minServicesCountInput = document.getElementById(
        "minServicesCount",
    ) as HTMLInputElement;

    minServicesCountInput.value = selectedFilters.toString();
}
/* HTML used to display filter options 
content needs to be populated dynamically
*/
export function createFilterHTML(): HTMLFormElement {
    // Create the form
    const form = document.createElement("form");
    form.id = "filters";
    form.className = "form-floating mb-3";

    // Heading
    const heading = document.createElement("h2");
    heading.textContent = "Filterung";
    form.appendChild(heading);

    // Row container
    const row = document.createElement("div");
    row.className = "row g-3 mb-3";
    form.appendChild(row);

    // --- Calendar select ---
    const calCol = document.createElement("div");
    calCol.className = "col-auto";

    const calLabel = document.createElement("label");
    calLabel.htmlFor = "selectedCalendars";
    calLabel.className = "form-label";
    calLabel.textContent = "Kalender";

    const calSelect = document.createElement("select");
    calSelect.className = "form-select";
    calSelect.id = "selectedCalendars";
    calSelect.name = "selectedCalendars";
    calSelect.multiple = true;
    calSelect.size = 10;

    calCol.appendChild(calLabel);
    calCol.appendChild(calSelect);
    row.appendChild(calCol);

    // --- Date & minServices inputs ---
    const dateCol = document.createElement("div");
    dateCol.className = "col-auto";

    const fromRow = document.createElement("div");
    fromRow.className = "row";
    const fromLabel = document.createElement("label");
    fromLabel.htmlFor = "fromDate";
    fromLabel.className = "form-label";
    fromLabel.textContent = "Von";
    const fromInput = document.createElement("input");
    fromInput.type = "date";
    fromInput.id = "fromDate";
    fromInput.className = "form-control";
    fromInput.name = "fromDate";
    fromInput.value = "2000-01-01"; //init later
    fromRow.appendChild(fromLabel);
    fromRow.appendChild(fromInput);

    const toRow = document.createElement("div");
    toRow.className = "row";
    const toLabel = document.createElement("label");
    toLabel.htmlFor = "toDate";
    toLabel.className = "form-label";
    toLabel.textContent = "Bis";
    const toInput = document.createElement("input");
    toInput.type = "date";
    toInput.id = "toDate";
    toInput.className = "form-control";
    toInput.name = "toDate";
    toInput.value = "2000-01-01"; //init later
    toRow.appendChild(toLabel);
    toRow.appendChild(toInput);

    const minRow = document.createElement("div");
    minRow.className = "row";
    const minLabel = document.createElement("label");
    minLabel.htmlFor = "minServicesCount";
    minLabel.className = "form-label";
    minLabel.textContent = "Mindestens # Dienste";
    const minInput = document.createElement("input");
    minInput.type = "number";
    minInput.id = "minServicesCount";
    minInput.className = "form-control";
    minInput.name = "minServicesCount";
    minInput.value = (0).toString(); //initialized later
    minRow.appendChild(minLabel);
    minRow.appendChild(minInput);

    dateCol.appendChild(fromRow);
    dateCol.appendChild(toRow);
    dateCol.appendChild(minRow);
    row.appendChild(dateCol);

    // --- Services select ---
    const serviceCol = document.createElement("div");
    serviceCol.className = "col-auto";

    const serviceLabel = document.createElement("label");
    serviceLabel.htmlFor = "selectedServices";
    serviceLabel.className = "form-label";
    serviceLabel.textContent = "Dienste";

    const serviceSelect = document.createElement("select");
    serviceSelect.className = "form-select";
    serviceSelect.id = "selectedServices";
    serviceSelect.name = "selectedServices";
    serviceSelect.multiple = true;
    serviceSelect.size = 10;

    serviceCol.appendChild(serviceLabel);
    serviceCol.appendChild(serviceSelect);
    row.appendChild(serviceCol);

    // --- Buttons ---
    const btnGroup = document.createElement("div");
    btnGroup.className = "d-flex gap-2 mt-2"; // flex row with spacing

    const btnRefresh = document.createElement("button");
    btnRefresh.type = "button";
    btnRefresh.id = "submitFilterBtn";
    btnRefresh.className = "btn btn-primary";
    btnRefresh.textContent = "Refresh Chart";

    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.id = "saveFilterBtn";
    btnSave.className = "btn btn-secondary";
    btnSave.textContent = "Save Filter as Default";

    const btnReload = document.createElement("button");
    btnReload.type = "button";
    btnReload.id = "resetFilterBtn";
    btnReload.className = "btn btn-secondary";
    btnReload.textContent = "Reload Filter Options";

    btnGroup.appendChild(btnRefresh);
    btnGroup.appendChild(btnSave);
    btnGroup.appendChild(btnReload);

    form.appendChild(btnGroup);

    return form;
}
