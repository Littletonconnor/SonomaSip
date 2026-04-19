# Entity-Relationship Diagram

```mermaid
erDiagram
    wineries ||--o{ winery_varietals : "has"
    wineries ||--o{ flights : "offers"
    wineries ||--o{ data_health_checks : "tracked by"
    wineries ||--o{ field_overrides : "overridden by"

    wineries {
        text id PK "slug, e.g. jordan-winery"
        text slug UK
        text name
        text description
        text tagline
        text website_url
        text phone
        text address_street
        text address_city
        text address_zip
        double latitude
        double longitude
        ava_region ava_primary
        ava_region ava_secondary
        reservation_type reservation_type
        text reservation_url
        jsonb hours "weekly hours object"
        smallint style_classic "1-5"
        smallint style_luxury "1-5"
        smallint style_family_friendly "1-5"
        smallint style_social "1-5"
        smallint style_sustainable "1-5"
        smallint style_adventure "1-5"
        noise_level noise_level
        boolean is_members_only
        boolean has_food_pairing
        boolean has_outdoor_seating
        boolean is_dog_friendly
        boolean kid_welcome
        boolean is_wheelchair_accessible
        boolean has_views
        numeric rating_google "1-5"
        smallint quality_score "1-10 editorial"
        smallint popularity_score "1-10 editorial"
        winery_setting setting
        boolean is_active
        text data_source
        timestamptz created_at
        timestamptz updated_at
    }

    winery_varietals {
        bigint id PK
        text winery_id FK
        text varietal
        boolean is_signature
        timestamptz created_at
    }

    flights {
        bigint id PK
        text winery_id FK
        text name
        numeric price
        smallint wines_count
        smallint duration_minutes
        flight_format format
        boolean food_included
        boolean reservation_required
        text description
        timestamptz created_at
        timestamptz updated_at
    }

    shared_itineraries {
        uuid id PK
        jsonb quiz_answers
        jsonb results "full winery+flight snapshot"
        smallint payload_version
        timestamptz created_at
    }

    import_runs {
        bigint id PK
        timestamptz started_at
        timestamptz finished_at
        text source_file_hash
        integer wineries_upserted
        integer flights_upserted
        integer varietals_upserted
        jsonb errors
        jsonb warnings
    }

    data_health_checks {
        bigint id PK
        text winery_id FK
        check_type check_type
        check_status status
        jsonb details
        timestamptz checked_at
        timestamptz resolved_at
    }

    field_overrides {
        bigint id PK
        text winery_id FK
        text field_name
        text override_value
        text reason
        timestamptz created_at
    }
```

## Enums

| Enum               | Values                                                                                                                                                                     |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reservation_type` | `walk_ins_welcome`, `reservations_recommended`, `appointment_only`                                                                                                         |
| `noise_level`      | `quiet`, `moderate`, `lively`                                                                                                                                              |
| `flight_format`    | `seated`, `standing`, `tour`, `outdoor`, `picnic`, `bar`                                                                                                                   |
| `ava_region`       | `russian_river_valley`, `dry_creek_valley`, `alexander_valley`, `sonoma_valley`, `carneros`, `sonoma_coast`, `sonoma_mountain`, `green_valley`, `petaluma_gap`, `rockpile` |
| `winery_setting`   | `vineyard`, `estate`, `downtown`, `hilltop`, `cave`                                                                                                                        |
| `check_type`       | `url_health`, `hours_drift`, `rating_drift`, `missing_data`, `user_report`                                                                                                 |
| `check_status`     | `open`, `resolved`, `ignored`                                                                                                                                              |

## RLS Policies

| Table                | `anon`/`authenticated` | `service_role`                      |
| -------------------- | ---------------------- | ----------------------------------- |
| `wineries`           | SELECT                 | Full (bypasses RLS)                 |
| `winery_varietals`   | SELECT                 | Full                                |
| `flights`            | SELECT                 | Full                                |
| `shared_itineraries` | SELECT                 | Full (INSERT via service role only) |
| `import_runs`        | None                   | Full                                |
| `data_health_checks` | None                   | Full                                |
| `field_overrides`    | None                   | Full                                |
