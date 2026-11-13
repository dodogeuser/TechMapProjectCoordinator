<?php

namespace Tests\Feature;

use Tests\TestCase;

class TechnicianMapTest extends TestCase
{
    public function test_map_renders_the_imported_directory_without_exposing_raw_html(): void
    {
        $this->get('/')->assertOk()
            ->assertSee('Your technician network')
            ->assertSee('window.technicians', false)
            ->assertSee('assets/app.js', false)
            ->assertSee('Miguel Gomez');
    }

    public function test_import_has_valid_coordinates_and_preserves_unlocated_records(): void
    {
        $rows = json_decode(file_get_contents(storage_path('app/technicians.json')), true, flags: JSON_THROW_ON_ERROR);
        $this->assertCount(2811, $rows);
        $this->assertCount(2811, array_unique(array_column($rows, 'id')));
        $mapped = 0;
        foreach ($rows as $row) {
            $this->assertNotEmpty($row['name']);
            $this->assertNotEmpty($row['trades']);
            if ($row['lat'] !== null) {
                $mapped++;
                $this->assertGreaterThanOrEqual(-90, $row['lat']);
                $this->assertLessThanOrEqual(90, $row['lat']);
                $this->assertGreaterThanOrEqual(-180, $row['lng']);
                $this->assertLessThanOrEqual(180, $row['lng']);
            }
        }
        $this->assertSame(2760, $mapped);
        $this->assertSame(51, count($rows) - $mapped);
    }
}
