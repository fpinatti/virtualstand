# Data Model: BGG Collection Sync & Local Storage

**Feature**: `001-bgg-collection-sync`  
**Date**: 2026-11-14  
**Status**: Completed  

---

## 1. Entity-Relationship Overview

```mermaid
erDiagram
    GAME ||--o| BOX_DIMENSION : "has physical packaging"
    GAME ||--o{ COLLECTION_ITEM : "catalogued in"
    SYNC_LOG ||--o{ COLLECTION_ITEM : "tracks batch"

    GAME {
        int bgg_id PK "Unique BoardGameGeek ID"
        string title "Primary game title"
        int year_published "Publication year"
        int min_players "Minimum supported players"
        int max_players "Maximum supported players"
        int min_playtime "Minimum playing duration (min)"
        int max_playtime "Maximum playing duration (min)"
        string thumbnail_url "Remote thumbnail image URL"
        string image_url "Remote full-resolution image URL"
        string local_thumbnail_uri "Cached local thumbnail file URI"
        string local_image_uri "Cached local cover image file URI"
        datetime created_at "First stored timestamp"
        datetime updated_at "Last updated timestamp"
    }

    BOX_DIMENSION {
        int id PK "Internal primary key"
        int bgg_id FK "Reference to GAME(bgg_id)"
        real width_cm "Box width in centimeters"
        real height_cm "Box height in centimeters"
        real depth_cm "Box depth in centimeters"
        real weight_kg "Box weight in kilograms"
        int version_id "BGG physical edition version ID"
        string version_name "Edition title or language descriptor"
        int is_estimated "Boolean flag (0=verified, 1=estimated fallback)"
        datetime updated_at "Last updated timestamp"
    }

    COLLECTION_ITEM {
        int id PK "Internal primary key"
        int coll_id UK "Unique BGG collection item identifier"
        int bgg_id FK "Reference to GAME(bgg_id)"
        int status_own "Boolean (1=owned, 0=not owned)"
        int status_wishlist "Boolean (1=wishlist, 0=not)"
        int status_played "Boolean (1=played, 0=not)"
        real bgg_rating "User rating on BGG (1.0 to 10.0)"
        string bgg_comment "User comments imported from BGG"
        string local_notes "Local user personal notes (preserved on sync)"
        string custom_tags "JSON array of local tags (preserved on sync)"
        string acquisition_date "Date acquired (ISO-8601 string)"
        datetime created_at "Created timestamp"
        datetime updated_at "Last updated timestamp"
    }

    SYNC_LOG {
        int id PK "Internal primary key"
        string username "BGG username synced"
        string status "Enum: QUEUED, IN_PROGRESS, COMPLETED, FAILED"
        int total_items "Total items reported in collection"
        int items_inserted "Count of new titles added"
        int items_updated "Count of titles updated"
        string error_message "Diagnostic error message on failure"
        datetime started_at "Sync start timestamp"
        datetime completed_at "Sync end timestamp"
    }
```

---

## 2. Table Schemas & Validation Rules

### 2.1 `games` Table
Stores canonical board game information. Independent of individual user ownership.
- `bgg_id`: `INTEGER PRIMARY KEY NOT NULL`. Positive integer.
- `title`: `TEXT NOT NULL`. Non-empty string (trimmed, UTF-8).
- `year_published`: `INTEGER`. Valid range: $-3500$ to $2100$.
- `min_players`: `INTEGER`. Default: $1$, range $1 \le min\_players \le max\_players$.
- `max_players`: `INTEGER`. Range: $\ge min\_players$.
- `min_playtime`: `INTEGER`. Minimum minutes $\ge 0$.
- `max_playtime`: `INTEGER`. Maximum minutes $\ge 0$.
- `thumbnail_url`: `TEXT`. Valid HTTP/HTTPS URL or null.
- `image_url`: `TEXT`. Valid HTTP/HTTPS URL or null.
- `local_thumbnail_uri`: `TEXT`. Local filesystem file path or null.
- `local_image_uri`: `TEXT`. Local filesystem file path or null.
- `created_at`: `INTEGER NOT NULL`. Unix epoch timestamp in milliseconds.
- `updated_at`: `INTEGER NOT NULL`. Unix epoch timestamp in milliseconds.

### 2.2 `box_dimensions` Table
Stores physical dimensions necessary for procedural 3D box generation.
- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL`.
- `bgg_id`: `INTEGER NOT NULL UNIQUE REFERENCES games(bgg_id) ON DELETE CASCADE`.
- `width_cm`: `REAL NOT NULL`. Positive float, range: $2.0 \le width \le 120.0$.
- `height_cm`: `REAL NOT NULL`. Positive float, range: $2.0 \le height \le 120.0$.
- `depth_cm`: `REAL NOT NULL`. Positive float, range: $0.5 \le depth \le 80.0$.
- `weight_kg`: `REAL`. Range: $\ge 0.0$ or null.
- `version_id`: `INTEGER`. Nullable BGG version ID.
- `version_name`: `TEXT`. Nullable descriptive string.
- `is_estimated`: `INTEGER NOT NULL DEFAULT 0`. Boolean (`1` if default fallback values used, `0` if verified from BGG version).
- `updated_at`: `INTEGER NOT NULL`. Unix epoch timestamp in milliseconds.

### 2.3 `collection_items` Table
Stores user ownership records, associating a game with ratings, comments, and local annotations.
- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL`.
- `coll_id`: `INTEGER NOT NULL UNIQUE`. Unique identifier assigned by BGG to each collection entry.
- `bgg_id`: `INTEGER NOT NULL REFERENCES games(bgg_id) ON DELETE CASCADE`.
- `status_own`: `INTEGER NOT NULL DEFAULT 1`. Boolean ($0$ or $1$).
- `status_wishlist`: `INTEGER NOT NULL DEFAULT 0`. Boolean ($0$ or $1$).
- `status_played`: `INTEGER NOT NULL DEFAULT 0`. Boolean ($0$ or $1$).
- `bgg_rating`: `REAL`. User rating from BGG ($1.0 \le rating \le 10.0$) or null if unrated.
- `bgg_comment`: `TEXT`. User comment from BGG or null.
- `local_notes`: `TEXT`. Custom user notes maintained only on device (MUST NEVER be overwritten by sync).
- `custom_tags`: `TEXT`. JSON string array of user tags (MUST NEVER be overwritten by sync).
- `acquisition_date`: `TEXT`. Optional ISO-8601 date string.
- `created_at`: `INTEGER NOT NULL`. Unix epoch timestamp in milliseconds.
- `updated_at`: `INTEGER NOT NULL`. Unix epoch timestamp in milliseconds.

### 2.4 `sync_logs` Table
Audit log of all synchronization operations.
- `id`: `INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL`.
- `username`: `TEXT NOT NULL`.
- `status`: `TEXT NOT NULL CHECK(status IN ('QUEUED', 'FETCHING_COLLECTION', 'FETCHING_DIMENSIONS', 'PERSISTING', 'COMPLETED', 'FAILED'))`.
- `total_items`: `INTEGER NOT NULL DEFAULT 0`.
- `items_inserted`: `INTEGER NOT NULL DEFAULT 0`.
- `items_updated`: `INTEGER NOT NULL DEFAULT 0`.
- `error_message`: `TEXT`. Diagnostic error string if failed.
- `started_at`: `INTEGER NOT NULL`. Unix epoch timestamp.
- `completed_at`: `INTEGER`. Unix epoch timestamp or null while in progress.

---

## 3. State Transitions for Synchronization

```mermaid
stateDiagram-v2
    [*] --> IDLE
    IDLE --> QUEUED : Trigger Sync(username)
    QUEUED --> FETCHING_COLLECTION : Dispatch Request
    FETCHING_COLLECTION --> QUEUED : HTTP 202 (Exponential Backoff Delay)
    FETCHING_COLLECTION --> FETCHING_DIMENSIONS : HTTP 200 (XML Parsed)
    FETCHING_DIMENSIONS --> PERSISTING : Batch Thing Requests Completed
    PERSISTING --> COMPLETED : SQLite Transaction Committed
    FETCHING_COLLECTION --> FAILED : Timeout / Network Error / HTTP 429
    FETCHING_DIMENSIONS --> FAILED : Network Error
    PERSISTING --> FAILED : SQLite Write Error
    FAILED --> IDLE : Acknowledge Error
    COMPLETED --> IDLE : UI Refreshed
```

