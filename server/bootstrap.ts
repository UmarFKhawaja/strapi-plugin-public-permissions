import type { Strapi } from "@strapi/strapi";
import { PluginGetter } from "./types";
import { setContentTypes } from "./helpers/setContentTypes";

export default async ({ strapi }: { strapi: Strapi }) => {
  const plugin: PluginGetter = strapi.plugin("public-permissions");

  await setContentTypes({
    strapi,
    roles: plugin.config("roles"),
    maxParallelOperations: plugin.config("maxParallelOperations"),
    verbose: plugin.config("verbose"),
  });
};
