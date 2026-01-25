# Database Schema Documentation

## Overview
The database uses PostgreSQL (via Supabase) to store card data for the Flesh and Blood TCG. The main table is `cards`.

## Tables

### `cards`
Stores all information related to individual cards.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key. Defaults to `gen_random_uuid()`. |
| `nombre` | TEXT | Name of the card (e.g., "Fyendal's Spring Tunic"). Indexed. |
| `clase` | TEXT | Class of the card (e.g., "Generic", "Ninja"). Indexed. |
| `costo` | TEXT | Cost to play the card. Text to handle special values. |
| `pitch` | INTEGER | Pitch value (1, 2, or 3). |
| `poder` | TEXT | Power/Attack value. |
| `defensa` | TEXT | Defense value. |
| `tipo` | TEXT | Full type line (e.g., "Generic Equipment - Chest"). |
| `rareza` | TEXT | Rarity (e.g., "Common", "Legendary"). |
| `set_code` | TEXT | Set identifier (e.g., "WTR"). Indexed. |
| `imagen` | TEXT | URL to the card image. |
| `texto` | TEXT | Card text/effect. |
| `keywords`| TEXT[] | Array of keywords (e.g., ["Go again"]). |
| `created_at` | TIMESTAMPTZ | Creation timestamp. |

## Indexes
- `idx_cards_nombre`: Optimizes search by card name.
- `idx_cards_clase`: Optimizes filtering by class.
- `idx_cards_set_code`: Optimizes filtering by set.

## Backup and Restore
### Backup
To backup the database, you can use the Supabase dashboard or the `pg_dump` command if you have direct access:
```bash
pg_dump -h <host> -p 5432 -U postgres -d postgres > backup.sql
```

### Restore
To restore:
```bash
psql -h <host> -p 5432 -U postgres -d postgres < backup.sql
```

## Seeding Data
To populate the database with initial data (Welcome to Rathe set):
1. Run the generation script (optional, already generated):
   ```bash
   node scripts/seed_gen.js
   ```
2. Execute the SQL file against your database:
   ```bash
   psql -h <host> -d postgres -U postgres -f db/seed.sql
   ```
