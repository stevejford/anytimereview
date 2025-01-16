# AnyTimeReview

## Database Backup and Rollback

Since Supabase backups are only available in the Pro plan, we've implemented a manual backup system using SQL migrations.

### Backup Files

Two important backup files are located in `supabase/migrations/`:

1. `0007_backup_before_changes.sql`:
   - Creates backup tables with current data
   - Backs up `client_forms` table
   - Backs up `auth.users` table
   - Backs up RLS policies

2. `0007_backup_rollback.sql`:
   - Contains scripts to restore everything if needed
   - Can restore all tables and data
   - Can restore RLS policies

### Using the Backup System

#### Creating a Backup
Before making significant changes to the database, run the backup migration:
```bash
supabase migration up 0007_backup_before_changes
```

#### Restoring from Backup
If you need to rollback changes:
```bash
supabase migration up 0007_backup_rollback
```

### Best Practices
- Create backups before major database changes
- Test the rollback procedure in a development environment
- Keep backup files in version control
- Document any custom changes to the backup process
