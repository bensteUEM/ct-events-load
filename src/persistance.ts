import { churchtoolsClient } from "@churchtools/churchtools-client";
import type {
    CustomModule,
    CustomModuleDataCategory,
    CustomModuleDataCategoryCreate,
    CustomModuleDataValue,
    CustomModuleDataValueCreate,
    Person,
} from "./utils/ct-types";

/**
 * ────────────────────────────────────────────────
 *  CUSTOM MODULE itself
 * ────────────────────────────────────────────────
 */

export async function getModule(
    extensionkey: string = import.meta.env.VITE_KEY,
): Promise<CustomModule> {
    console.log("Extension Key:", extensionkey);
    const allModules: Array<CustomModule> =
        await churchtoolsClient.get(`/custommodules`);
    console.log("Retrieving Modules", allModules);

    const module = allModules.find(
        (item: CustomModule) => item.shorty === extensionkey,
    );
    console.log(`Module ${extensionkey} found:`, module);

    if (!module) {
        throw new Error(
            `Module for extension key "${extensionkey}" not found.`,
        );
    }

    return module;
}

/**
 * ────────────────────────────────────────────────
 *  CUSTOM DATA CATEGORIES
 * ────────────────────────────────────────────────
 */

/** GET `/custommodules/{moduleId}/customdatacategories` */
export async function getCustomDataCategories(
    moduleId?: number,
): Promise<CustomModuleDataCategory[]> {
    if (!moduleId) {
        const module = await getModule();
        moduleId = module.id;
    }
    const categories: CustomModuleDataCategory[] = await churchtoolsClient.get(
        `/custommodules/${moduleId}/customdatacategories`,
    );
    console.log(`Fetched categories for module ${moduleId}:`, categories);
    return categories;
}

/** retrieve a single category */
export async function getCustomDataCategory(
    shorty: string,
): Promise<CustomModuleDataCategory | undefined> {
    const categories = await getCustomDataCategories();
    return categories.find((category) => category.shorty === shorty);
}

/** POST `/custommodules/{moduleId}/customdatacategories` */
export async function createCustomDataCategory(
    payload: CustomModuleDataCategoryCreate,
    moduleId?: number,
): Promise<CustomModuleDataCategory> {
    if (!moduleId) {
        const module = await getModule();
        moduleId = module.id;
    }
    const newCategory: CustomModuleDataCategory = await churchtoolsClient.post(
        `/custommodules/${moduleId}/customdatacategories`,
        payload,
    );
    console.log(`Created category in module ${moduleId}:`, newCategory);
    return newCategory;
}

/** PUT `/custommodules/{moduleId}/customdatacategories/{dataCategoryId}` */
export async function updateCustomDataCategory(
    dataCategoryId: number,
    payload: Partial<CustomModuleDataCategory>,
    moduleId?: number,
): Promise<CustomModuleDataCategory> {
    if (!moduleId) {
        const module = await getModule();
        moduleId = module.id;
    }
    const updatedCategory: CustomModuleDataCategory =
        await churchtoolsClient.put(
            `/custommodules/${moduleId}/customdatacategories/${dataCategoryId}`,
            payload,
        );
    console.log(
        `Updated category ${dataCategoryId} in module ${moduleId}:`,
        updatedCategory,
    );
    return updatedCategory;
}

/** DELETE `/custommodules/{moduleId}/customdatacategories/{dataCategoryId}` */
export async function deleteCustomDataCategory(
    dataCategoryId: number,
    moduleId?: number,
): Promise<void> {
    if (!moduleId) {
        const module = await getModule();
        moduleId = module.id;
    }
    await churchtoolsClient.deleteApi(
        `/custommodules/${moduleId}/customdatacategories/${dataCategoryId}`,
    );
    console.log(`Deleted category ${dataCategoryId} from module ${moduleId}`);
}

/**
 * ────────────────────────────────────────────────
 *  CUSTOM DATA VALUES
 * ────────────────────────────────────────────────
 */

/** GET `/custommodules/{moduleId}/customdatacategories/{dataCategoryId}/customdatavalues` */
export async function getCustomDataValues(
    dataCategoryId: number,
    moduleId?: number,
): Promise<CustomModuleDataValue[]> {
    if (!moduleId) {
        const module = await getModule();
        moduleId = module.id;
    }
    const values: CustomModuleDataValue[] = await churchtoolsClient.get(
        `/custommodules/${moduleId}/customdatacategories/${dataCategoryId}/customdatavalues`,
    );
    console.log(`Fetched data values for category ${dataCategoryId}:`, values);
    return values;
}

/** POST `/custommodules/{moduleId}/customdatacategories/{dataCategoryId}/customdatavalues` */
export async function createCustomDataValue(
    payload: CustomModuleDataValueCreate,
    moduleId?: number,
): Promise<string> {
    if (!moduleId) {
        const module = await getModule();
        moduleId = module.id;
    }
    const newValue: string = await churchtoolsClient.post(
        `/custommodules/${moduleId}/customdatacategories/${payload.dataCategoryId}/customdatavalues`,
        payload,
    );
    console.log(
        `Created data value in category ${payload.dataCategoryId}:`,
        newValue,
    );
    return newValue;
}

/** PUT `/custommodules/{moduleId}/customdatacategories/{dataCategoryId}/customdatavalues/{valueId}` */
export async function updateCustomDataValue(
    dataCategoryId: number,
    valueId: number,
    payload: Partial<CustomModuleDataValue>,
    moduleId?: number,
): Promise<CustomModuleDataValue> {
    if (!moduleId) {
        const module = await getModule();
        moduleId = module.id;
    }
    const updatedValue: CustomModuleDataValue = await churchtoolsClient.put(
        `/custommodules/${moduleId}/customdatacategories/${dataCategoryId}/customdatavalues/${valueId}`,
        payload,
    );
    console.log(
        `Updated data value ${valueId} in category ${dataCategoryId}:`,
        updatedValue,
    );
    return updatedValue;
}

/** DELETE `/custommodules/{moduleId}/customdatacategories/{dataCategoryId}/customdatavalues/{valueId}` */
export async function deleteCustomDataValue(
    dataCategoryId: number,
    valueId: number,
    moduleId?: number,
): Promise<void> {
    if (!moduleId) {
        const module = await getModule();
        moduleId = module.id;
    }
    await churchtoolsClient.deleteApi(
        `/custommodules/${moduleId}/customdatacategories/${dataCategoryId}/customdatavalues/${valueId}`,
    );
    console.log(
        `Deleted data value ${valueId} from category ${dataCategoryId}`,
    );
}

/**
 * ────────────────────────────────────────────────
 *  ct-events-load specific functions
 * ────────────────────────────────────────────────
 */

/** Reset stored categories for all users if they don't exist
 * @return {Promise<boolean>} - true if reset was finished
 */
export async function resetStoredCategories(): Promise<boolean> {
    const categories = await getCustomDataCategories();
    const filtersExist = categories.some(
        (item: CustomModuleDataCategory) => item.name === "filters",
    );

    if (filtersExist) {
        console.log("Filters category exists:", filtersExist);
        return true; // nothing to do
    }

    const data_schema = JSON.stringify({
        type: "object",
        properties: {
            userId: { type: ["string", "number"] },
            selected: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        calendars: { type: "array", items: { type: "number" } },
                        services: { type: "array", items: { type: "number" } },
                        months: { type: "number" },
                        minServicesCount: { type: "number" },
                    },
                    required: [
                        "calendars",
                        "services",
                        "months",
                        "minServicesCount",
                    ],
                },
            },
        },
        required: ["userId", "selected"],
    });

    await createCustomDataCategory({
        customModuleId: (await getModule()).id,
        name: "filters",
        shorty: "filters",
        description: "Stores filter selections for users",
        data: data_schema,
    })
        .then((category) => {
            console.log("Created category:", category);
        })
        .catch((err) => console.error(err));

    return true;
}

/* Store filter selections for a user */
export async function setFilters(
    selected: {
        calendars: number[];
        services: number[];
        months: number;
        minServicesCount: number;
    },
    userId?: number,
) {
    if (!userId) {
        const user = await churchtoolsClient.get<Person>(`/whoami`);
        userId = user.id;
    }

    const categoryName = "filters";
    const category = await getCustomDataCategory(categoryName);
    if (category === undefined) {
        await resetStoredCategories();
        console.log("Category 'filters' not found. Creating it now.");
    }
    const categoryId = category?.id ?? 0;

    await createCustomDataValue({
        dataCategoryId: categoryId,
        value: JSON.stringify({
            userId: userId,
            selected: selected,
        }),
    });

    console.log("Storing filters for user:", userId, selected);
}

/* Update filter selections for users with existing filter */
export async function updateFilters(
    selected: {
        calendars: number[];
        services: number[];
        months: number;
        minServicesCount: number;
    },
    userId?: number,
) {
    if (!userId) {
        const user = await churchtoolsClient.get<{ id: number }>(`/whoami`);
        userId = user.id;
    }

    const category = await getCustomDataCategory("filters");
    if (!category) {
        await resetStoredCategories();
        console.log("Category 'filters' not found. Creating it now.");
    }

    const categoryId = category?.id ?? 0;

    // Fetch existing values
    const values = await getCustomDataValues(categoryId);
    const existing = values.find((v) => JSON.parse(v.value).userId === userId);

    if (existing) {
        // Update the existing value
        await updateCustomDataValue(categoryId, existing.id, {
            value: JSON.stringify({
                userId,
                selected,
            }),
        });
        console.log("Updated filters for user:", userId, selected);
    } else {
        // Create new value if none exists
        await createCustomDataValue({
            dataCategoryId: categoryId,

            value: JSON.stringify({
                userId,
                selected,
            }),
        });
        console.log("Created filters for user:", userId, selected);
    }
}

/* Retrieve filter selections for a user */
export async function getFilters(userId?: number): Promise<{
    calendars: number[];
    services: number[];
    months: number;
    minServicesCount: number;
} | null> {
    if (!userId) {
        const user = await churchtoolsClient.get<{ id: number }>(`/whoami`);
        userId = user.id;
    }

    const category = await getCustomDataCategory("filters");
    if (!category) return null;

    const values = await getCustomDataValues(category.id);

    const userValue = values.find((v) => {
        const parsed = JSON.parse(v.value);
        return parsed.userId === userId;
    });

    if (!userValue) return null;

    const parsed = JSON.parse(userValue.value);
    return parsed.selected;
}
