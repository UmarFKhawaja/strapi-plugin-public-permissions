import type { Strapi } from "@strapi/strapi";
import {
  createDbOperationsLists,
  isEmpty,
  replaceObjectKeyWithApiId,
  replaceObjectKeyWithPluginId,
  replaceWildcardWithModelNames,
  db,
} from ".";
import { Transaction, UPPermission } from "./db/types";

export async function setContentTypes({
  strapi,
  roles = [],
  // actions = {},
  // plugins = {},
  maxParallelOperations,
  verbose = false,
}: {
  strapi: Strapi;
  roles: {
    name: string;
    actions: Record<string, string[]>;
    plugins: Record<string, string[]>;
  }[];
  maxParallelOperations: number;
  verbose: boolean;
}): Promise<void> {
  function log(...args: string[]) {
    if (verbose) {
      strapi.log.info(...args);
    }
  }

  function warn(...args: string[]) {
    strapi.log.warn(...args);
  }

  if (typeof maxParallelOperations === "number") {
    warn(
      `"maxParallelOperations" configuration option is deprecated. It no longer has any effect.`
    );
  }

  if (!roles || !roles.length) {
    warn(`No roles found in public-permissions plugin config.`);
    return;
  }

  if (roles.every(({ actions, plugins }) => isEmpty({ ...actions, ...plugins }))) {
    warn(`No actions or plugins found in any roles in public-permissions plugin config.`);
    return;
  }

  await Promise.all(
    roles.map(async ({ name, actions, plugins }) => {
      log(`---------------------------------------`);
      log(`Setting permissions to ${name}...`);

      const configuredActions = Object.entries(
        replaceObjectKeyWithApiId(replaceWildcardWithModelNames(strapi, actions))
      );

      const configuredPlugins = Object.entries(
        replaceObjectKeyWithPluginId(plugins)
      );

      const { toDelete, toInsert } = createDbOperationsLists([
        ...configuredActions,
        ...configuredPlugins,
      ]);

      await strapi.db.connection.transaction(async function (trx: Transaction) {
        let namedRole = await db.getNamedRole(trx, name);

        if (!namedRole) {
          warn(`No role found. Creating one.`);

          await db.createRoles(trx);

          namedRole = await db.getNamedRole(trx, name);
        }

        const permissions = await db.getPermissions(trx);

        const existingPermissions: UPPermission[] = [];
        const permissionsToDelete: UPPermission[] = [];
        const permissionsToInsert: string[] = [];

        for (const permission of permissions) {
          if (!permission.action) {
            continue;
          }

          const action = permission.action;

          const model = action.match(/([\w-:.]+)\..+$/)?.[1] ?? "";

          const toInsertIncludesAction = toInsert.includes(action);
          const toDeleteIncludesModel = toDelete.includes(model);

          if (toInsertIncludesAction) {
            existingPermissions.push(permission);
          }

          if (!toInsertIncludesAction && toDeleteIncludesModel) {
            permissionsToDelete.push(permission);
          }
        }

        for (const action of toInsert) {
          if (!existingPermissions.find((p) => p.action === action)) {
            permissionsToInsert.push(action);
          }
        }

        await db.deletePermissions(trx, permissionsToDelete);

        log(`Deleted  ${permissionsToDelete.length} old permissions.`);

        const insertedPermissionIds = await db.insertPermissions(
          trx,
          permissionsToInsert
        );

        log(`Inserted ${insertedPermissionIds.length} new permissions.`);

        const permissionIdsThatNeedLinks = [
          ...insertedPermissionIds,
          ...existingPermissions.map(({ id }) => id),
        ];

        const isV5 = await db.isV5(trx);

        const existingLinks = await db.getPermissionsLinksByPermissionIds(
          trx,
          permissionIdsThatNeedLinks,
          isV5
        );

        const linksToInsert = permissionIdsThatNeedLinks.filter(
          (id) => !existingLinks.find((l) => l.permission_id === id)
        );

        await db.insertPermissionLinks(trx, linksToInsert, namedRole.id, isV5);

        log(`Finished setting permissions to ${name}!`);
        log(`---------------------------------------`);
      });
    })
  )
}
