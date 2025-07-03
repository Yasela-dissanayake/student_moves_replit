#!/bin/bash

# Database Management Scripts
# --------------------------
# This script provides commands to manage the database

# Function to apply migrations
apply_migrations() {
  echo "Applying database migrations..."
  tsx server/scripts/apply-migrations.ts
}

# Function to seed the database
seed_database() {
  echo "Seeding the database with initial data..."
  tsx server/scripts/seed-data.ts
}

# Function to backup the database
backup_database() {
  echo "Creating database backup..."
  tsx server/scripts/backup-database.ts
}

# Function to monitor database health
monitor_database() {
  echo "Monitoring database health..."
  tsx server/scripts/monitor-database.ts
}

# Function to run all operations
run_all() {
  apply_migrations
  seed_database
  backup_database
  monitor_database
}

# Main execution logic
case "$1" in
  migrate)
    apply_migrations
    ;;
  seed)
    seed_database
    ;;
  backup)
    backup_database
    ;;
  monitor)
    monitor_database
    ;;
  all)
    run_all
    ;;
  *)
    echo "Usage: $0 {migrate|seed|backup|monitor|all}"
    echo ""
    echo "Commands:"
    echo "  migrate - Apply database migrations"
    echo "  seed    - Seed the database with initial data"
    echo "  backup  - Create a database backup"
    echo "  monitor - Check database health and performance"
    echo "  all     - Run all operations in sequence"
    exit 1
    ;;
esac

exit 0