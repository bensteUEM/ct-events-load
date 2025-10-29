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

    // End: fromDate + days
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
    form.className = "c-card__main form-floating mb-3";

    // Heading
    const heading = document.createElement("h2");
    heading.textContent = "Filters";
    heading.className = "text-body-l-emphasized m-0 grow";
    form.appendChild(heading);

    // Row container
    const row = document.createElement("div");
    row.className = "flex gap-4 px-4 pb-4 justify-center";
    form.appendChild(row);

    // --- Calendar select column ---
    const calCol = document.createElement("div");
    calCol.className = "flex flex-col px-4 py-3 gap-2";

    // Label above the select
    const calLabel = document.createElement("label");
    calLabel.htmlFor = "selectedCalendars";
    calLabel.className = "text-body-s-emphasized";
    calLabel.textContent = "Kalender";

    // Multi-select
    const calSelect = document.createElement("select");
    calSelect.className = "multi-select-status flex-1";
    calSelect.id = "selectedCalendars";
    calSelect.name = "selectedCalendars";
    calSelect.multiple = true;
    calSelect.size = 10;

    // Combine
    calCol.appendChild(calLabel);
    calCol.appendChild(calSelect);
    row.appendChild(calCol);

    // --- Date & minServices inputs ---
    const dateCol = document.createElement("div");
    dateCol.className = "flex flex-col px-4 py-3 gap-2";

    // --- From Date ---
    const fromRow = document.createElement("div");
    fromRow.className = "flex items-center gap-2";
    const fromLabel = document.createElement("label");
    fromLabel.htmlFor = "fromDate";
    fromLabel.className = "text-body-s-emphasized w-32 shrink-0";
    fromLabel.textContent = "Von";
    const fromInput = document.createElement("input");
    fromInput.type = "date";
    fromInput.id = "fromDate";
    fromInput.name = "fromDate";
    fromInput.className = "flex-1";
    fromInput.value = "2000-01-01";
    fromRow.appendChild(fromLabel);
    fromRow.appendChild(fromInput);

    // --- To Date ---
    const toRow = document.createElement("div");
    toRow.className = "flex items-center gap-2";
    const toLabel = document.createElement("label");
    toLabel.htmlFor = "toDate";
    toLabel.className = "text-body-s-emphasized w-32 shrink-0";
    toLabel.textContent = "Bis";
    const toInput = document.createElement("input");
    toInput.type = "date";
    toInput.id = "toDate";
    toInput.name = "toDate";
    toInput.className = "flex-1";
    toInput.value = "2000-01-01"; // init value
    toRow.appendChild(toLabel);
    toRow.appendChild(toInput);

    // --- Min Services Count ---
    const minRow = document.createElement("div");
    minRow.className = "flex items-center gap-2";
    const minLabel = document.createElement("label");
    minLabel.htmlFor = "minServicesCount";
    minLabel.className = "text-body-s-emphasized w-32 shrink-0";
    minLabel.textContent = "Mindestens # Dienste";
    const minInput = document.createElement("input");
    minInput.type = "number";
    minInput.id = "minServicesCount";
    minInput.name = "minServicesCount";
    minInput.className = "flex-1";
    minInput.value = "0"; // init value
    minRow.appendChild(minLabel);
    minRow.appendChild(minInput);

    // --- Combine
    dateCol.appendChild(fromRow);
    dateCol.appendChild(toRow);
    dateCol.appendChild(minRow);

    // --- Append to parent row/container ---
    row.appendChild(dateCol);

    // --- Services select column ---
    const serviceCol = document.createElement("div");
    serviceCol.className = "flex flex-col px-4 py-3 gap-2";

    // Label above the select
    const serviceLabel = document.createElement("label");
    serviceLabel.htmlFor = "selectedServices";
    serviceLabel.className = "text-body-s-emphasized";
    serviceLabel.textContent = "Dienste";

    // Multi-select
    const serviceSelect = document.createElement("select");
    serviceSelect.className = "form-select flex-1";
    serviceSelect.id = "selectedServices";
    serviceSelect.name = "selectedServices";
    serviceSelect.multiple = true;
    serviceSelect.size = 10;

    // Combine
    serviceCol.appendChild(serviceLabel);
    serviceCol.appendChild(serviceSelect);
    row.appendChild(serviceCol);

    // --- Button group ---
    const btnGroup = document.createElement("div");
    btnGroup.className = "flex gap-2 mt-2 justify-center";

    // --- Refresh Chart button ---
    const btnRefresh = document.createElement("button");
    btnRefresh.type = "button";
    btnRefresh.id = "submitFilterBtn";
    btnRefresh.className =
        "c-button c-button__S c-button__primary rounded-sm text-body-m-emphasized " +
        "gap-2 justify-center px-4 py-2 " +
        "text-white bg-green-b-bright ";
    btnRefresh.textContent = "Refresh Chart";

    // --- Save Filter button ---
    const btnSave = document.createElement("button");
    btnSave.type = "button";
    btnSave.id = "saveFilterBtn";
    btnSave.className =
        "c-button c-button__S c-button__primary rounded-sm text-body-m-emphasized " +
        "gap-2 justify-center px-4 py-2 " +
        "text-white bg-gray-b-bright ";
    btnSave.textContent = "Save Filter as Default";

    // --- Reload Filter button ---
    const btnReload = document.createElement("button");
    btnReload.type = "button";
    btnReload.id = "resetFilterBtn";
    btnReload.className =
        "c-button c-button__S c-button__primary rounded-sm text-body-m-emphasized " +
        "gap-2 justify-center px-4 py-2 " +
        "text-white bg-gray-b-bright ";
    btnReload.textContent = "Reload Filter Options";

    // --- Combine buttons into group ---
    btnGroup.appendChild(btnRefresh);
    btnGroup.appendChild(btnSave);
    btnGroup.appendChild(btnReload);
    form.appendChild(btnGroup);

    return form;
}
