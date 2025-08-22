import { TABLE } from "./table";
import { Transaction, UPRole } from "./types";

export const getNamedRole = async (trx: Transaction, name: string): Promise<UPRole> => {
  return trx
    .select("*")
    .where({ type: name })
    .from(TABLE.roles)
    .first();
};
