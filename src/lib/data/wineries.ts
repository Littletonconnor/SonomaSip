import type { Tables } from '../database.types';
import type { WineryForDisplay, WineryForMatching } from '../types';
import { toWineryForDisplay, toWineryForMatching } from '../mappers';
import { createServerSupabase } from '../supabase-server';

type WineryRow = Tables<'wineries'>;
type FlightRow = Tables<'flights'>;
type VarietalRow = Tables<'winery_varietals'>;

type WineryWithRelations = WineryRow & {
  flights: FlightRow[];
  winery_varietals: VarietalRow[];
};

export async function getWineriesForMatching(): Promise<WineryForMatching[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('wineries')
    .select('*, flights(*), winery_varietals(*)');

  if (error) throw new Error(error.message);

  return (data as WineryWithRelations[])
    .filter((row) => row.is_active)
    .map((row) => toWineryForMatching(row, row.flights, row.winery_varietals));
}

export async function getWineryBySlug(slug: string): Promise<WineryForDisplay | null> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('wineries')
    .select('*, flights(*), winery_varietals(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(error.message);
  }

  if (!data) return null;

  const row = data as WineryWithRelations;
  return toWineryForDisplay(row, row.flights, row.winery_varietals);
}

export async function getAllWinerySlugs(): Promise<string[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('wineries')
    .select('slug')
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(error.message);

  return (data as { slug: string }[]).map((row) => row.slug);
}

export async function getAllWineriesForBrowse(): Promise<WineryForDisplay[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from('wineries')
    .select('*, flights(*), winery_varietals(*)')
    .order('name');

  if (error) throw new Error(error.message);

  return (data as WineryWithRelations[])
    .filter((row) => row.is_active)
    .map((row) => toWineryForDisplay(row, row.flights, row.winery_varietals));
}
