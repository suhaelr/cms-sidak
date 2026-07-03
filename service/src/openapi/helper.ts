import { ex } from './examples';

type ResponseExample = { description: string; value: unknown };

export function doc(
  summary: string,
  description: string,
  tag: string,
  opts?: {
    auth?: boolean;
    responses?: Record<number, ResponseExample>;
  },
) {
  const detail: Record<string, unknown> = {
    summary,
    description,
    tags: [tag],
  };

  if (opts?.auth) {
    detail.security = [{ bearerAuth: [] }];
  }

  if (opts?.responses) {
    detail.responses = Object.fromEntries(
      Object.entries(opts.responses).map(([code, r]) => [
        code,
        {
          description: r.description,
          content: {
            'application/json': {
              example: r.value,
            },
          },
        },
      ]),
    );
  }

  return { detail };
}

export const err = (status: number, msg: string) => ({
  [status]: { description: msg, value: { error: msg } },
});

export const ok = (description: string, value: unknown = ex.success) => ({
  200: { description, value },
});

export const created = (description: string, value: unknown) => ({
  200: { description, value },
});

export const crudList = (entity: string, tag: string, example: unknown) =>
  doc(`List ${entity}`, `Returns all ${entity} records. Public endpoints may filter by visibility.`, tag, {
    responses: ok(`${entity} list`, example),
  });

export const crudGet = (entity: string, tag: string, example: unknown) =>
  doc(`Get ${entity} by ID`, `Returns a single ${entity} record.`, tag, {
    responses: {
      ...ok(`${entity} detail`, example),
      ...err(404, 'Not found'),
    },
  });

export const crudCreate = (entity: string, tag: string, example: unknown) =>
  doc(`Create ${entity}`, `Creates a new ${entity}. Requires admin role.`, tag, {
    auth: true,
    responses: {
      ...created(`Created ${entity}`, example),
      ...err(403, 'Forbidden'),
    },
  });

export const crudUpdate = (entity: string, tag: string, example: unknown) =>
  doc(`Update ${entity}`, `Updates an existing ${entity}. Requires admin role.`, tag, {
    auth: true,
    responses: {
      ...ok(`Updated ${entity}`, example),
      ...err(403, 'Forbidden'),
      ...err(404, 'Not found'),
    },
  });

export const crudDelete = (entity: string, tag: string) =>
  doc(`Delete ${entity}`, `Deletes a ${entity} by ID. Requires admin role.`, tag, {
    auth: true,
    responses: {
      ...ok('Deleted successfully', ex.success),
      ...err(403, 'Forbidden'),
    },
  });
