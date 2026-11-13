<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Explore your nationwide technician network. Find local tradespeople by trade, name, and location.">
<title>TechAtlas — Technician network</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='10' fill='%230b6b5b'/%3E%3Ctext x='10' y='29' fill='white' font-size='28'%3E⌖%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="{{ asset('assets/leaflet.css') }}">
<link rel="stylesheet" href="{{ asset('assets/MarkerCluster.css') }}">
<link rel="stylesheet" href="{{ asset('assets/app.css') }}">
</head>
<body>
<header><div class="brand"><span class="brand-icon">⌖</span><div>TechAtlas<small>YOUR NATIONWIDE NETWORK</small></div></div><div class="header-right"><span class="source">Project coordinator workspace</span><span><i class="live"></i>Network overview</span><div class="avatar" aria-label="Technician coordinator">TC</div></div></header>
<main>
<section class="intro"><div><div class="eyebrow">People on the ground. All in one place.</div><h1>Your technician network</h1><p>Find the right trade, in the right place, when you need it.</p></div><div class="stats"><div class="stat"><strong id="total-stat">{{ number_format(count($technicians)) }}</strong><span>Technician records</span></div><div class="stat"><strong id="mapped-stat">—</strong><span>Mapped locations</span></div><div class="stat"><strong id="trade-stat">—</strong><span>Trade categories</span></div></div><div class="intro-actions"><div class="view-toggle" aria-label="View"><button class="active" id="map-view" aria-pressed="true">⌖ &nbsp; Map</button><button id="list-view" aria-pressed="false">☷ &nbsp; Directory</button></div><button class="button" id="export">↓ &nbsp; Export CSV</button></div></section>
<section class="workspace">
<aside class="sidebar" aria-label="Technician filters and results"><div class="filters"><h2>Find a technician <button class="text-button" id="reset">Reset filters</button></h2><div class="search-wrap"><span aria-hidden="true">⌕</span><input type="search" id="search" placeholder="Search name, city, ZIP, or phone…" aria-label="Search technicians"></div><select id="state" aria-label="Filter by state"><option value="">All states & territories</option></select><select id="location-status" aria-label="Filter by location status"><option value="all">All location statuses</option><option value="mapped">Mapped locations</option><option value="unmapped">Location needed</option></select><div class="filter-title"><span>FILTER BY TRADE</span><button id="all-trades" class="text-button">Select all</button></div><div class="trades" id="trades"></div></div><div class="results-heading"><div id="result-count" aria-live="polite"></div><span>A–Z</span></div><div id="results" class="results"></div><div class="pagination"><span id="page-info"></span><div><button id="previous" aria-label="Previous page">‹</button> <button id="next" aria-label="Next page">›</button></div></div><div class="notice" id="unmapped-note"></div></aside>
<div class="map-panel"><div id="map" aria-label="United States technician map"></div><div class="map-toolbar"><div class="map-label"><i class="live"></i><b>United States</b><span>Technician coverage</span></div><div class="map-actions"><button class="button" id="fit">⛶ &nbsp; Fit results</button><button class="button" id="home" title="Show the United States">⌂ &nbsp; US view</button></div></div><div class="map-footer"><strong>Explore your network</strong><br>Click a pin for contact details. Zoom in to separate nearby technicians.</div><div id="directory" class="directory-table" hidden></div><section id="detail" class="detail" aria-label="Selected technician" hidden></section></div>
</section></main>
<script>window.technicians = {{ Illuminate\Support\Js::from($technicians) }};</script>
<script src="{{ asset('assets/leaflet.js') }}"></script><script src="{{ asset('assets/leaflet.markercluster.js') }}"></script><script src="{{ asset('assets/app.js') . '?v=' . filemtime(public_path('assets/app.js')) }}"></script>
</body></html>
