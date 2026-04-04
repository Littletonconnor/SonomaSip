import type { Tables } from '../database.types';
import type { Winery } from '../types';
import { toWinery } from '../mappers';
import { createServerSupabase } from '../supabase-server';

type WineryRow = Tables<'wineries'>;
type FlightRow = Tables<'flights'>;
type VarietalRow = Tables<'winery_varietals'>;

type WineryWithRelations = WineryRow & {
  flights: FlightRow[];
  winery_varietals: VarietalRow[];
};

export async function getWineryLookup(): Promise<Map<string, Winery>> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('wineries')
    .select('*, flights(*), winery_varietals(*)')
    .eq('is_active', true);

  if (error) throw new Error(error.message);

  const map = new Map<string, Winery>();
  for (const row of data as WineryWithRelations[]) {
    map.set(row.id, toWinery(row, row.flights, row.winery_varietals));
  }
  return map;
}
