const sequelize = require('./database');
const { Sequelize } = require('sequelize');
const migrate = require('./migrate');

async function ensureServiceNameColumn() {
  const qi = sequelize.getQueryInterface();
  try {
    // Ensure migrations table exists
    await migrate.initMigrationsTable();

    // Describe table to see columns
    let desc;
    try {
      desc = await qi.describeTable('RequestLogs');
    } catch (err) {
      console.log('RequestLogs table does not exist yet, nothing to fix.');
      return;
    }

    if (desc.serviceName) {
      console.log('serviceName column already exists.');
    } else {
      console.log('Adding serviceName column to RequestLogs...');
      await qi.addColumn('RequestLogs', 'serviceName', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'default'
      });
      console.log('Added serviceName column.');

      try {
        await qi.addIndex('RequestLogs', ['serviceName'], { name: 'idx_service_name' });
        console.log('Added index idx_service_name');
      } catch (e) {
        console.warn('Index creation skipped or failed:', e.message);
      }
    }

    // Mark migration as applied so migration runner won't try to create table
    const migrationName = '001_create_request_log_table.js';
    const applied = await migrate.getAppliedMigrations();
    if (!applied.includes(migrationName)) {
      console.log('Recording migration as applied:', migrationName);
      await migrate.recordMigration(migrationName);
      console.log('Migration recorded.');
    } else {
      console.log('Migration already recorded.');
    }

  } catch (err) {
    console.error('Error fixing schema:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

ensureServiceNameColumn();
