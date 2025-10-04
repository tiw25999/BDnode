const fs = require('fs');
const path = require('path');

// Create .env file from template
const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRE=7d

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`;

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file from template');
  console.log('📝 Please update the Supabase configuration in .env file');
} else {
  console.log('⚠️  .env file already exists');
}

console.log('\n🔧 Next steps:');
console.log('1. Update SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
console.log('2. Run: npm run seed');
console.log('3. Run: npm run dev');
