<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    $technicians = json_decode(file_get_contents(storage_path('app/technicians.json')), true, flags: JSON_THROW_ON_ERROR);
    return view('map', ['technicians' => $technicians]);
});
