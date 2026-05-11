const sequelize = require('./database');

async function cleanup() {
  try {
    const indexes = ['idx_status_code','idx_created_at','idx_service_name','idx_method_status','idx_service_created'];
    for (const idx of indexes) {
      try {
        await sequelize.query(`DROP INDEX IF EXISTS ${idx};`);
        console.log('Dropped index if existed:', idx);
      } catch (e) {
        console.warn('Error dropping index', idx, e.message);
      }
    }
  } catch (err) {
    console.error('Cleanup error:', err.message);
  } finally {
    await sequelize.close();
  }
}

cleanup();
