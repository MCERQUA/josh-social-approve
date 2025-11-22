#!/bin/bash

# Social Media Approval System - Database Setup Script
# This script initializes the Neon PostgreSQL database with the required schema

echo "========================================="
echo "Social Media Approval Database Setup"
echo "========================================="
echo ""

# Database connection string
DB_CONNECTION="postgresql://neondb_owner:npg_M1KCzjnGhgL5@ep-billowing-union-ahca6j30-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

echo "Connecting to Neon database..."
echo ""

# Run the schema SQL file
psql "$DB_CONNECTION" < database-schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Database schema created successfully!"
    echo ""
    echo "Next steps:"
    echo "1. cd social-approve-app"
    echo "2. npm run dev"
    echo "3. Open http://localhost:3000"
    echo ""
else
    echo ""
    echo "✗ Error: Failed to create database schema"
    echo ""
    exit 1
fi
