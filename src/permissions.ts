import { churchtoolsClient } from "@churchtools/churchtools-client";

/** Retrieve permissions */
async function getPermissions(): Promise<Record<string, Record<string, any>>> {
    const permissions: Record<
        string,
        Record<string, any>
    > = await churchtoolsClient.get("/permissions/global");
    console.log("User permissions:", permissions);
    return permissions;
}

/* Retrieve list of ServiceGroup IDs that can be written by the current user */
export async function getWritebleServicegroupIds(): Promise<Array<number>> {
    const permissions = await getPermissions();
    const writeableServiceGroupIds: Array<number> =
        permissions["churchservice"]["edit servicegroup"];
    console.log("Writeable ServiceGroup IDs:", writeableServiceGroupIds);
    return writeableServiceGroupIds;
}