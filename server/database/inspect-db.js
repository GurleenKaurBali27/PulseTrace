const sequelize = require('./database');

async function inspect() {
  try {
    const [tables] = await sequelize.query("SELECT name, type, sql FROM sqlite_master WHERE type IN ('table','index') ORDER BY type, name;");
    console.log('SQLite master rows:');
    tables.forEach((t) => {
      console.log('-', t.name, t.type || 'index', t.sql ? t.sql.slice(0,200).replace(/\s+/g,' ') : '');
    });

    // Check if RequestLogs exists via PRAGMA
    try {
      const [cols] = await sequelize.query("PRAGMA table_info('RequestLogs');");
      console.log('\nPRAGMA table_info(RequestLogs):');
      console.log(cols);
    } catch (err) {
      console.log('\nRequestLogs PRAGMA failed:', err.message);
    }

    // List indexes (if any)
    try {
      const [idx] = await sequelize.query("PRAGMA index_list('RequestLogs');");
      console.log('\nPRAGMA index_list(RequestLogs):');
      console.log(idx);
    } catch (err) {
      console.log('\nPRAGMA index_list failed:', err.message);
    }

  } catch (err) {
    console.error('Error inspecting DB:', err.message);
  } finally {
    await sequelize.close();
  }
}

inspect();
