import { TABLE } from "./table";
import { Transaction, UPPermission } from "./types";

export const getPermissionsByModel = async (
  trx: Transaction,
  model: string
): Promise<UPPermission[]> => {
  return trx(TABLE.permissions)
    .select("*")
    .where("action", "like", `${model}.%`);
};
