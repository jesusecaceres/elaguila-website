# Rentas: “Usar mi ubicación” — behavior contract

## User flow

1. User clicks **only** — no `navigator.geolocation` on page load.
2. On success: write `lat`, `lng` to results URL (and optional `radius_km` placeholder, default e.g. 25).
3. **Filtering:** Until a geo index + reverse-geocode service exists, grid results **do not** narrow by radius (avoid fake precision). UI may show: “Ubicación guardada — pronto podrás ordenar por cercanía.”
4. On deny / error: show non-blocking message; manual `city` / `zip` remain authoritative.

## Future

- Reverse geocode `(lat,lng)` → nearest `city` / `postalCode` for filter parity
- Server-side radius query when listings store coordinates
