import mongoose from 'mongoose';

async function verify() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Database connection successful!');
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

verify();
