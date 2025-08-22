import { TABLE } from "./table";
import { Transaction, UPPermission } from "./types";

export const getPermissions = async (
  trx: Transaction
): Promise<UPPermission[]> => {
  return trx(TABLE.permissions).select("*");
};
