import { Injectable, OnModuleInit } from '@nestjs/common';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import { Database, Tables } from '@/utils/supabase.types';
import { PaginateParams } from 'common';

@Injectable()
export class DBService implements OnModuleInit {
  private postgresClient: ReturnType<typeof postgres>;
  private supabaseClient: ReturnType<typeof createClient<Database>>;

  onModuleInit() {
    const connectionString = process.env.DATABASE_URL;
    this.postgresClient = postgres(connectionString);

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    this.supabaseClient = createClient<Database>(supabaseUrl, supabaseKey);
  }

  async paginate<
    T extends keyof Database['public']['Tables'],
    R extends object,
  >({
    table,
    page = 1,
    limit = 10,
    selectQuery = '*',
    orderBy,
    order = 'asc',
    orderReference,
    searchFilters,
    filters,
  }: PaginateParams<T>) {
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    // Fetch data with pagination
    const query = this.supabase
      .from(table)
      .select(selectQuery as '*', { count: 'exact' })
      .range(start, end)
      .throwOnError();

    if (orderBy) {
      query.order(orderBy, {
        ascending: !order || order === 'asc',
        referencedTable: orderReference,
      });
    }

    filters?.forEach(({ key, operator, value }) => {
      if (key) {
        query.filter(key, operator, value);
      }
    });

    const orFilter = [];

    searchFilters?.forEach(({ key, operator, value }) => {
      if (key) {
        // todo: handle arrays later, for now only primitive values
        orFilter.push(
          `${key}.${operator}.${['ilike', 'like'].includes(operator) ? `%${value}%` : value}`,
        );
      }
    });

    if (orFilter.length > 0) {
      query.or(orFilter.join(','));
    }

    const { data, count } = await query;

    return {
      data: (data ?? []) as unknown as (Tables<T> & R)[],
      total: count || 0,
      pages: Math.ceil((count || 0) / limit),
      page,
      limit,
    };
  }

  get supabase() {
    return this.supabaseClient;
  }

  // Expose the raw SQL instance for advanced use cases
  get sql() {
    return this.postgresClient;
  }
}
