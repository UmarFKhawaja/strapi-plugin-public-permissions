import { TABLE } from "./table";
import { Transaction, UPPermission } from "./types";

export const deletePermissions = async (
  trx: Transaction,
  permissions: UPPermission[]
): Promise<number> => {
  return trx(TABLE.permissions)
    .whereIn(
      "id",
      permissions.map(({ id }) => id)
    )
    .del();
};
