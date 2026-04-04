import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/user.model.js';
import { ROLES } from './src/constants/roles.js';

dotenv.config();

const create = async () => {
  try {
    const dbName = process.env.MONGO_DB_NAME || 'gisign';
    await mongoose.connect(process.env.MONGO_URI, { dbName });
    
    const email = 'mediamarek2025@gmail.com';
    const password = 'Admin@123';
    
    // Check if exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('User already exists. Updating password...');
      existing.password = password;
      await existing.save();
      console.log('Password updated.');
    } else {
      await User.create({
        name: 'Media Marek',
        email,
        password,
        role: ROLES.SUPERADMIN,
        companyId: null,
        company: null
      });
      console.log('User created successfully as SuperAdmin.');
    }
    
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

create();
