export type ValidationError = { wineryId: string; field: string; message: string };

const SONOMA_BOUNDS = {
  latMin: 38.0,
  latMax: 39.0,
  lonMin: -123.5,
  lonMax: -122.0,
};

export function validateWinery(
  winery: Record<string, unknown>,
  id: string,
): { errors: ValidationError[]; warnings: ValidationError[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!id) {
    errors.push({ wineryId: id, field: 'id', message: 'Missing id/slug' });
  }
  if (!winery.name) {
    errors.push({ wineryId: id, field: 'name', message: 'Missing name' });
  }
  if (winery.latitude == null || winery.longitude == null) {
    errors.push({
      wineryId: id,
      field: 'lat/lng',
      message: 'Missing coordinates',
    });
  } else {
    const lat = winery.latitude as number;
    const lon = winery.longitude as number;
    if (
      lat < SONOMA_BOUNDS.latMin ||
      lat > SONOMA_BOUNDS.latMax ||
      lon < SONOMA_BOUNDS.lonMin ||
      lon > SONOMA_BOUNDS.lonMax
    ) {
      warnings.push({
        wineryId: id,
        field: 'lat/lng',
        message: `Coordinates (${lat}, ${lon}) outside Sonoma County bounds`,
      });
    }
  }
  if (!winery.ava_primary) {
    errors.push({
      wineryId: id,
      field: 'ava_primary',
      message: 'Missing AVA region',
    });
  }
  if (!winery.reservation_type) {
    errors.push({
      wineryId: id,
      field: 'reservation_type',
      message: 'Missing reservation type',
    });
  }

  const websiteUrl = winery.website_url as string | undefined;
  if (websiteUrl && !websiteUrl.startsWith('https://')) {
    warnings.push({
      wineryId: id,
      field: 'website_url',
      message: `URL not HTTPS: ${websiteUrl}`,
    });
  }

  return { errors, warnings };
}

export function validateFlight(
  flight: Record<string, unknown>,
  wineryId: string,
  flightName: string,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const ctx = `${wineryId}/${flightName}`;

  if (!flightName) {
    errors.push({
      wineryId: ctx,
      field: 'flight_name',
      message: 'Missing flight name',
    });
  }

  const price = flight.price as number | null;
  if (price != null && (price < 0 || price > 500)) {
    errors.push({
      wineryId: ctx,
      field: 'price',
      message: `Price out of range: ${price}`,
    });
  }

  return errors;
}
