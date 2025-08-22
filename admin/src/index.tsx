import { prefixPluginTranslations } from "@strapi/helper-plugin";

import pluginPkg from "../../package.json";
import pluginId from "./pluginId";
import Initializer from "./components/Initializer";

const name = pluginPkg.strapi.name;

export default {
  register(app: any) {
    const plugin = {
      id: pluginId,
      initializer: Initializer,
      isReady: false,
      name,
    };

    app.registerPlugin(plugin);
  },

  bootstrap(app: any) {},

  async registerTrads(app: any) {
    const { locales } = app;

    const importedTrads = await Promise.all(
      (locales as any[]).map(async (locale) => {
        try {
          const { default: data } = await import(`./translations/${locale}.json`);

          return {
            data: prefixPluginTranslations(data, pluginId),
            locale
          };
        } catch {
          return {
            data: {},
            locale
          };
        }
      })
    );

    return importedTrads;
  },
};
