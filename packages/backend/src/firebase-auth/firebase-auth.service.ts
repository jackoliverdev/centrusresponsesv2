import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseAuthError } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAuthService implements OnModuleInit {
  async onModuleInit() {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  async createUser(email: string, password: string) {
    try {
      return await admin.auth().createUser({
        email,
        password,
      });
    } catch (error) {
      if (error instanceof FirebaseAuthError) {
        throw new BadRequestException({ ...error.toJSON(), error: 'Bad Request' });
      }

      throw new Error(`Error creating user: ${(error as any).message}`);
    }
  }

  async getUser(uid: string) {
    try {
      const userRecord = await admin.auth().getUser(uid);
      return userRecord;
    } catch (error) {
      throw new Error(`Error getting user: ${(error as any).message}`);
    }
  }

  async updateUser(uid: string, updateData: admin.auth.UpdateRequest) {
    try {
      const userRecord = await admin.auth().updateUser(uid, updateData);
      return userRecord;
    } catch (error) {
      throw new Error(`Error updating user: ${(error as any).message}`);
    }
  }

  async deleteUser(uid: string) {
    try {
      await admin.auth().deleteUser(uid);
      return true;
    } catch (error) {
      throw new Error(`Error deleting user: ${(error as any).message}`);
    }
  }

  async verifyIdToken(idToken: string) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new Error(`Error verifying ID token: ${(error as any).message}`);
    }
  }
}
