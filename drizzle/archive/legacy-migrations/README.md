# Legacy Migration Archive

These migrations were part of the initial schema evolution but have been **superseded by a complete schema rewrite** in `0000_salty_shiver_man.sql`.

## 📋 Archived Files:

### `0000_black_mauler.sql` (Initial Schema)
- **Purpose**: First database schema implementation
- **Key Features**: 
  - Used `text` PRIMARY KEYs 
  - Basic `customers` and `deals` tables
  - Simple structure without relationships
- **Status**: Completely replaced by modern schema

### `0001_spicy_wendell_rand.sql` (Password Addition)
- **Purpose**: Added password hash field to customers table
- **Changes**: `ALTER TABLE customers ADD passwordHash text;`
- **Status**: Obsolete (customers table renamed to contacts)

### `0002_worried_solo.sql` (Major Refactor)
- **Purpose**: Large-scale schema transformation
- **Key Changes**:
  - Renamed `customers` → `contacts` 
  - Added `companies`, `users`, `sales_reps`, `offerings` tables
  - Implemented proper relational structure
  - Added `deal_offerings` bridge table
- **Status**: All functionality incorporated into current schema

### `0003_awesome_hardball.sql` (Address Fields)
- **Purpose**: Enhanced contacts with location data
- **Changes**: Added `address`, `city`, `state_province`, `postal_code` to contacts
- **Status**: All address fields included in current schema

## 🔄 Schema Evolution Summary:

```
v1 (0000) → Simple customers/deals with text IDs
v2 (0001) → Added password authentication  
v3 (0002) → Full CRM structure with relationships
v4 (0003) → Enhanced contact location data
v5 (CURRENT) → Complete rewrite with integer autoincrement IDs
```

## ✅ Current Active Migration:
- **File**: `0000_salty_shiver_man.sql`
- **Features**: Modern schema with `integer PRIMARY KEY AUTOINCREMENT`
- **Includes**: All functionality from legacy migrations plus recent enhancements

## 📅 Archive Information:
- **Archived**: $(date '+%Y-%m-%d %H:%M:%S')
- **Reason**: Schema superseded by complete rewrite
- **Safety**: All files preserved for historical reference
- **Impact**: Zero impact on current functionality

---
*These files are kept for historical reference and debugging purposes. The current active schema contains all functionality from these legacy migrations.* 