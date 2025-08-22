export const createDbOperationsLists = (
  configuredActions: [string, string[]][]
): { toInsert: string[]; toDelete: string[] } => {
  const result: { toInsert: string[]; toDelete: string[] } = configuredActions.reduce(
    (acc: { toInsert: string[]; toDelete: string[] }, [key, value]) => {
      const isEmpty = !value?.length || !value[0];

      if (isEmpty) {
        return {
          ...acc,
          toDelete: [...acc.toDelete, key],
        };
      }

      return {
        ...acc,
        toInsert: [
          ...acc.toInsert,
          ...value.map((action) => `${key}.${action}`),
        ],
        toDelete: [...acc.toDelete, key],
      };
    },
    {
      toInsert: [],
      toDelete: [],
    }
  );

  return result;
};
