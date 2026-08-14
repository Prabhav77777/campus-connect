'use server';

import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function signUp(data: FormData | { name?: string; email?: string; password?: string; hostel?: string; roomNumber?: string }) {
  try {
    let name = '';
    let email = '';
    let password = '';
    let hostel = '';
    let roomNumber = '';

    if (data instanceof FormData) {
      name = data.get('name') as string;
      email = data.get('email') as string;
      password = data.get('password') as string;
      hostel = data.get('hostel') as string;
      roomNumber = (formData => formData.get('roomNumber') as string)(data) || '';
    } else {
      name = data.name || '';
      email = data.email || '';
      password = data.password || '';
      hostel = data.hostel || '';
      roomNumber = data.roomNumber || '';
    }

    email = email.trim().toLowerCase();

    if (!name || !email || !password || !hostel) {
      return { error: 'Missing required fields' };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'User with this email already exists' };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        hostel,
        roomNumber: roomNumber || null,
        role: 'STUDENT',
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error in signUp:', error);
    return { error: 'Failed to create user' };
  }
}
