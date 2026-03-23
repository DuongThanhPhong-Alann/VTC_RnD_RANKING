import "server-only";

type SupabaseError = { message: string; status?: number };
type QueryResult<T = unknown> = { data: T[] | null; error: SupabaseError | null };

function getConfig() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      error: { message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" } as SupabaseError,
    };
  }

  return {
    baseUrl: `${supabaseUrl.replace(/\/+$/, "")}/rest/v1`,
    serviceRoleKey,
    error: null as SupabaseError | null,
  };
}

async function parseError(response: Response): Promise<SupabaseError> {
  const fallback = { message: `Supabase request failed: ${response.status}`, status: response.status };
  try {
    const body = await response.json();
    return {
      message: String(body?.message ?? body?.error_description ?? body?.error ?? fallback.message),
      status: response.status,
    };
  } catch {
    return fallback;
  }
}

class QueryBuilder {
  private table: string;
  private selectClause = "*";
  private filters: Array<{ field: string; value: string }> = [];
  private limitValue?: number;
  private updatePayload?: Record<string, unknown>;

  constructor(table: string) {
    this.table = table;
  }

  select(selectClause: string) {
    this.selectClause = selectClause;
    return this;
  }

  limit(limit: number) {
    this.limitValue = limit;
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.updatePayload = payload;
    return this;
  }

  async eq(field: string, value: string): Promise<QueryResult> {
    this.filters.push({ field, value });
    if (this.updatePayload) {
      return this.runUpdate();
    }
    return this.runSelect();
  }

  private buildQueryString() {
    const params = new URLSearchParams();
    params.set("select", this.selectClause);
    if (this.limitValue !== undefined) {
      params.set("limit", String(this.limitValue));
    }
    for (const filter of this.filters) {
      params.set(filter.field, `eq.${filter.value}`);
    }
    return params.toString();
  }

  private getHeaders() {
    const config = getConfig();
    if (config.error) {
      return { error: config.error, headers: null as HeadersInit | null, baseUrl: "" };
    }
    return {
      error: null as SupabaseError | null,
      baseUrl: config.baseUrl,
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
      } as HeadersInit,
    };
  }

  private async runSelect(): Promise<QueryResult> {
    const config = this.getHeaders();
    if (config.error || !config.headers) {
      return { data: null, error: config.error };
    }

    const url = `${config.baseUrl}/${this.table}?${this.buildQueryString()}`;
    const response = await fetch(url, { method: "GET", headers: config.headers, cache: "no-store" });
    if (!response.ok) {
      return { data: null, error: await parseError(response) };
    }

    const data = (await response.json()) as unknown[];
    return { data, error: null };
  }

  private async runUpdate(): Promise<QueryResult> {
    const config = this.getHeaders();
    if (config.error || !config.headers) {
      return { data: null, error: config.error };
    }

    const params = new URLSearchParams();
    for (const filter of this.filters) {
      params.set(filter.field, `eq.${filter.value}`);
    }
    const query = params.toString();
    const url = query
      ? `${config.baseUrl}/${this.table}?${query}`
      : `${config.baseUrl}/${this.table}`;

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        ...config.headers,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(this.updatePayload ?? {}),
    });

    if (!response.ok) {
      return { data: null, error: await parseError(response) };
    }

    return { data: null, error: null };
  }
}

export const supabaseAdmin = {
  from(table: string) {
    return new QueryBuilder(table);
  },
};
