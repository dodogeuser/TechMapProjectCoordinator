# TechAtlas

A Laravel 13 / Blade application for exploring your US technician network, imported from `technicians-simple.xlsx` and the supplied Google My Maps map.

## Run locally

This workspace already has dependencies and a local PHP binary installed:

```bash
./scripts/serve.sh
```

Open **http://localhost:8000**. Set `PORT=8001` to use another port. No database or frontend build is needed for this read-only directory.

On another machine, install PHP 8.4+ and Composer, then run:

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan serve
```

The checked-in dependency lock currently includes packages requiring PHP 8.4. `.tools/` contains an ignored local PHP 8.4 executable and Composer downloaded from their official distributions for this workspace only.

## Features

- US map with clustered, individually clickable technician pins; nearby pins separate when zoomed or spiderfied.
- Contact details, call links, and Google Maps directions.
- 17 color-coded trade categories, including an Unspecified group. Multi-trade technicians match any selected category; pins use their first category's color.
- Name, location, ZIP, phone, state, and trade search; state and location-status filters.
- Paginated directory and CSV export of the current filtered results.
- Responsive layout with keyboard-accessible filters and details.

## Data and location quality

The importer preserves **2,811 nonempty spreadsheet records**, including duplicate names. **2,760 records** match map coordinates. **51 records** lack matching coordinates and are retained under **Location needed**; many only say `USA` in the source. No coordinates are invented. Existing map pins may represent a city rather than a verified street address.

Spreadsheet trade fields include spelling variants, phone numbers, and unrelated notes. Recognized trades are normalized into categories for filtering; unrecognized values use Unspecified. Source values remain in `storage/app/technicians.json`; unrelated source notes are not displayed as trade labels.

The map data is read server-side and embedded by Blade. There is no public JSON file containing the directory, though all records are available to visitors of the app. Deploy behind your organization's access controls if the directory is private.

### Refresh the import

Download the HTML of your Google My Maps viewer page, then run:

```bash
curl -L 'https://www.google.com/maps/d/viewer?mid=1g51B1FzObxoOs8-aDIqvYQMATHr0YjI' -o /tmp/techmap-viewer.html
python3 scripts/import_technicians.py technicians-simple.xlsx /tmp/techmap-viewer.html
```

The Python importer uses the standard library, matches normalized names and phone numbers, and preserves the original workbook. Google may change the viewer's embedded data format. Review ambiguous duplicate names and map coordinates before using them for dispatch.

## Verify

```bash
.tools/php artisan test
npm ci
npm test
node --check public/assets/app.js
```

PHP tests cover rendering and imported data integrity. JavaScript DOM tests cover map-layer synchronization, trade/state/location filters, search, contacts, pagination, directory switching, and HTML escaping. Visual browser QA could not be completed because the browser host was unavailable in the build session.

## Hosting

Deploy to a PHP-capable Laravel host with its web root set to `public/`, HTTPS enabled, and writable `storage/` and `bootstrap/cache/`. Set `APP_ENV=production`, `APP_DEBUG=false`, and the correct `APP_URL`. Run `php artisan optimize` after deployment. This Laravel app is not compatible with Sites' static / Cloudflare Worker hosting runtime.

Leaflet 1.9.4 and MarkerCluster 1.5.3 are vendored in `public/assets/`; map tiles load directly from OpenStreetMap with contributor attribution. An internet connection is required for tiles, Google Maps directions, and optional Google Fonts. No paid map API key is required. Retain the libraries' license notices.

Map tile usage follows the [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/). The standard public tile service is intended for normal interactive viewing and has no availability guarantee.
