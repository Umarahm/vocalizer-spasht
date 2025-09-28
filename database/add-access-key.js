#!/usr/bin/env node

/**
 * Add Access Key Script for Speech Game
 * Manually add access keys to the database for authorized users
 * Usage: node database/add-access-key.js
 */

const { Client } = require('pg');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function addAccessKey() {
    const connectionString = process.env.NEON_DATABASE_URL;

    if (!connectionString) {
        console.error('❌ NEON_DATABASE_URL environment variable not found!');
        console.error('Please ensure your .env.local file contains the Neon database URL.');
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

        // Create readline interface for user input
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        // Function to prompt for access key
        const promptAccessKey = () => {
            return new Promise((resolve) => {
                rl.question('Enter the access key to add (or "quit" to exit): ', (answer) => {
                    resolve(answer.trim());
                });
            });
        };

        // Function to validate and add access key
        const addKeyToDatabase = async (accessKey) => {
            try {
                // Check if access key already exists
                const checkResult = await client.query(
                    'SELECT id, created_at, is_active FROM users WHERE access_key = $1',
                    [accessKey]
                );

                if (checkResult.rows.length > 0) {
                    const user = checkResult.rows[0];
                    console.log('⚠️  Access key already exists!');
                    console.log(`   ID: ${user.id}`);
                    console.log(`   Created: ${user.created_at}`);
                    console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);

                    rl.question('Do you want to reactivate this user? (y/N): ', async (answer) => {
                        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                            await client.query(
                                'UPDATE users SET is_active = TRUE, last_active = NOW() WHERE access_key = $1',
                                [accessKey]
                            );
                            console.log('✅ User reactivated successfully!');
                        } else {
                            console.log('ℹ️  No changes made.');
                        }
                        await askForNextKey();
                    });
                    return;
                }

                // Add new access key
                const result = await client.query(
                    'INSERT INTO users (access_key) VALUES ($1) RETURNING id, created_at',
                    [accessKey]
                );

                const newUser = result.rows[0];
                console.log('✅ Access key added successfully!');
                console.log(`   User ID: ${newUser.id}`);
                console.log(`   Created: ${newUser.created_at}`);
                console.log(`   Access Key: ${accessKey}`);

                await askForNextKey();

            } catch (error) {
                console.error('❌ Error adding access key:', error.message);
                await askForNextKey();
            }
        };

        // Function to ask if user wants to add another key
        const askForNextKey = () => {
            return new Promise((resolve) => {
                rl.question('\nAdd another access key? (Y/n): ', (answer) => {
                    const shouldContinue = answer.toLowerCase() !== 'n' && answer.toLowerCase() !== 'no';
                    resolve(shouldContinue);
                });
            });
        };

        // Main loop
        const mainLoop = async () => {
            while (true) {
                const accessKey = await promptAccessKey();

                if (accessKey.toLowerCase() === 'quit' || accessKey.toLowerCase() === 'exit') {
                    console.log('👋 Goodbye!');
                    rl.close();
                    return;
                }

                if (!accessKey) {
                    console.log('⚠️  Please enter a valid access key.');
                    continue;
                }

                await addKeyToDatabase(accessKey);

                const shouldContinue = await askForNextKey();
                if (!shouldContinue) {
                    console.log('👋 Goodbye!');
                    rl.close();
                    return;
                }
            }
        };

        // Show current users count
        try {
            const countResult = await client.query('SELECT COUNT(*) as total_users, COUNT(*) FILTER (WHERE is_active = TRUE) as active_users FROM users');
            const stats = countResult.rows[0];
            console.log(`📊 Database Status:`);
            console.log(`   Total Users: ${stats.total_users}`);
            console.log(`   Active Users: ${stats.active_users}`);
            console.log('');
        } catch (error) {
            console.warn('⚠️  Could not fetch user statistics:', error.message);
        }

        console.log('🔑 Access Key Management Tool');
        console.log('=============================');
        console.log('Enter access keys to add authorized users to the Speech Game.');
        console.log('Each access key represents one user account.');
        console.log('');

        await mainLoop();

    } catch (error) {
        console.error('❌ Database error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

// Function to list existing access keys
async function listAccessKeys() {
    const connectionString = process.env.NEON_DATABASE_URL;

    if (!connectionString) {
        console.error('❌ NEON_DATABASE_URL environment variable not found!');
        process.exit(1);
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const result = await client.query(
            'SELECT id, access_key, created_at, last_active, is_active FROM users ORDER BY created_at DESC LIMIT 20'
        );

        console.log('📋 Recent Access Keys:');
        console.log('=====================');

        if (result.rows.length === 0) {
            console.log('No access keys found in database.');
        } else {
            result.rows.forEach((user, index) => {
                console.log(`${index + 1}. ${user.access_key}`);
                console.log(`   ID: ${user.id} | Created: ${user.created_at.toISOString().split('T')[0]} | Active: ${user.is_active ? '✅' : '❌'}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('❌ Error listing access keys:', error.message);
    } finally {
        await client.end();
    }
}

// Check command line arguments
const args = process.argv.slice(2);

if (args.includes('--list') || args.includes('-l')) {
    // List existing access keys
    listAccessKeys();
} else {
    // Interactive mode to add access keys
    addAccessKey();
}

