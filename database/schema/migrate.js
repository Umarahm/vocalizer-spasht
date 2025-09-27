#!/usr/bin/env node

/**
 * Database Migration Script for Speech Game
 * Run this script to set up the Neon DB schema
 * Usage: node database/schema/migrate.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

async function migrate() {
    const connectionString = process.env.NEON_DATABASE_URL;

    if (!connectionString) {
        console.error('❌ NEON_DATABASE_URL environment variable not found!');
        console.error('Please add your Neon DB connection string to .env.local');
        console.error('Example: NEON_DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require');
        process.exit(1);
    }

    console.log('🔄 Connecting to Neon DB...');

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Read and execute simple schema
        const schemaPath = path.join(__dirname, 'simple-schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('🔄 Executing schema migration...');

        // Split schema into individual statements and execute them
        const rawStatements = schema.split(';');

        console.log(`Found ${rawStatements.length} raw statement groups`);

        // Debug: show first few statements
        for (let i = 0; i < Math.min(5, rawStatements.length); i++) {
            console.log(`Raw statement ${i}: "${rawStatements[i]}"`);
        }

        const statements = rawStatements
            .map(stmt => {
                // Remove comment lines but keep the actual SQL
                const lines = stmt.split('\n').filter(line => line.trim() && !line.trim().startsWith('--'));
                return lines.join('\n').trim();
            })
            .filter(stmt => stmt.length > 0);

        console.log(`Filtered to ${statements.length} executable statements`);

        // Debug: show filtered statements
        for (let i = 0; i < Math.min(statements.length, 5); i++) {
            console.log(`Filtered statement ${i}: "${statements[i].substring(0, 100)}..."`);
        }

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
                try {
                    await client.query(statement);
                    console.log(`✅ Statement ${i + 1} executed successfully`);
                } catch (error) {
                    // Ignore "already exists" errors for CREATE TABLE IF NOT EXISTS and CREATE INDEX IF NOT EXISTS
                    if (error.message.includes('already exists')) {
                        console.log(`ℹ️  Statement ${i + 1} skipped (already exists)`);
                    } else {
                        console.warn(`⚠️  Warning executing statement ${i + 1}: ${error.message}`);
                        console.warn(`Statement was: ${statement}`);
                    }
                }
            }
        }

        console.log('✅ Schema migration completed successfully!');
        console.log('🎉 Database is ready for the Speech Game!');

        // Test the database with a simple query
        console.log('🔍 Testing database connection...');
        const result = await client.query('SELECT COUNT(*) as user_count FROM users');
        console.log(`📊 Current users in database: ${result.rows[0].user_count}`);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

// Run migration if called directly
if (require.main === module) {
    migrate().catch(console.error);
}

module.exports = migrate;
