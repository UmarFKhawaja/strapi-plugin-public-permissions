import * as yup from 'yup';

const schema = yup.object().shape({
  verbose: yup.boolean().default(false),
  maxParallelOperations: yup.number().optional(),
  roles: yup.lazy((value) => {
    return yup.array().of(yup.object({
      name: yup.string().required(),
      actions: yup.lazy((value) => {
        const shape = {};

        for (const [key] of Object.entries(value ?? {})) {
          // @ts-ignore
          shape[key] = yup.array().of(yup.string());
        }

        return yup.object().shape(shape);
      }),
      plugins: yup.lazy((value) => {
        const shape = {};

        for (const [key] of Object.entries(value ?? {})) {
          // @ts-ignore
          shape[key] = yup.array().of(yup.string());
        }

        return yup.object().shape(shape);
      })
    }))
  }),
});

export default {
  default: {
    verbose: false,
    roles: [
      {
        actions: {},
        plugins: {}
      }
    ]
  },
  async validator(config: any) {
    await schema.validate(config);
  }
};
