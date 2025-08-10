const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://walesolagbade@localhost:5432/openstream',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const addProfileFields = async () => {
  try {
    console.log('🔧 Adding extended profile fields to users table...');
    
    // Add new profile fields if they don't exist
    const fields = [
      'location VARCHAR(255)',
      'website VARCHAR(255)',
      'twitter VARCHAR(100)',
      'instagram VARCHAR(100)',
      'soundcloud VARCHAR(100)',
      'spotify VARCHAR(100)'
    ];
    
    for (const field of fields) {
      const fieldName = field.split(' ')[0];
      try {
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${field}`);
        console.log(`✅ Added field: ${fieldName}`);
      } catch (error) {
        console.log(`⚠️ Field ${fieldName} might already exist:`, error.message);
      }
    }
    
    console.log('✅ Extended profile fields migration completed successfully');
    
  } catch (error) {
    console.error('❌ Error adding profile fields:', error);
    throw error;
  }
};

// Export the function
module.exports = { addProfileFields };

// Run directly if this file is executed
if (require.main === module) {
  addProfileFields()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
