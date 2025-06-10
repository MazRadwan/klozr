import NextAuth from 'next-auth';
import type { NextAuthConfig, User, Account, Profile } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { db } from '@/lib/db';
import { users } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';

// NextAuth v5 with App Router configuration
const authOptions: NextAuthConfig = {
  debug: true,
  logger: {
    error: console.error,
    warn: console.warn,
    debug: console.debug,
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', required: true },
        password: { label: 'Password', type: 'password', required: true },
      },
      async authorize(credentials) {
        console.debug('[Auth] authorize called with credentials:', credentials);
        const email = typeof credentials?.email === 'string' ? credentials.email : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';
        console.debug('[Auth] Parsed email/password', { email, password });
        if (!email || !password) return null;
        console.debug('[Auth] Executing DB query for email:', email);
        const user = await db.select().from(users).where(eq(users.email, email)).limit(1).then(result => result[0]);
        console.debug('[Auth] DB returned user:', user);
        const bcrypt = await import('bcryptjs');
        if (user) {
          if (user.password_hash == null) {
            // Federated user wants to set a password (upgrade to regular account)
            const hash = await bcrypt.hash(password, 10);
            await db.update(users)
              .set({ password_hash: hash })
              .where(eq(users.email, email)).run?.();
            return { id: user.id.toString(), email: user.email, name: user.username };
          } else if (typeof user.password_hash === 'string' && await bcrypt.compare(password, user.password_hash)) {
            // Regular login
            console.debug('[Auth] Password match succeeded for email:', email);
            return { id: user.id.toString(), email: user.email, name: user.username };
          }
          // Password incorrect or not set
          console.warn('[Auth] authorize failed for email:', email);
          return null;
        } else {
          // No user found, create new
          const hash = await bcrypt.hash(password, 10);
          const result = await db.insert(users).values({
            username: '', // Optionally prompt for username
            email,
            password_hash: hash,
            is_active: true,
          }).returning({ id: users.id }).get();
          return { id: result.id.toString(), email, name: '' };
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  theme: { colorScheme: 'auto' },
  callbacks: {
    async signIn({ 
      user, 
      account, 
      profile, 
      email, 
      credentials 
    }: {
      user: User;
      account: Account | null;
      profile?: Profile;
      email?: { verificationRequest?: boolean };
      credentials?: Record<string, any>;
    }) {
      try {
        console.debug('[Auth] signIn callback', { user, account, profile, email, credentials });
        // Insert federated users (Google/GitHub) into users table if not already present
        if ((account?.provider === 'google' || account?.provider === 'github') && user?.email) {
          // Check if the user already exists
          const existing = await db.select().from(users).where(eq(users.email, user.email)).limit(1);
          if (!existing.length) {
            await db.insert(users).values({
              username: user.name || user.email || '',
              email: user.email,
              password_hash: '', // Use empty string for federated users
              is_active: true,
            }).run?.(); // .run() for drizzle-orm, but safe if not present
          }
        }
        return true;
      } catch (e) {
        console.error('[Auth] signIn error:', e);
        return false;
      }
    },
    async jwt({ 
      token, 
      user, 
      account, 
      profile, 
      isNewUser 
    }: {
      token: JWT;
      user?: User;
      account?: Account | null;
      profile?: Profile;
      isNewUser?: boolean;
    }) {
      console.debug('[Auth] jwt callback', { token, user, account, profile, isNewUser });
      return token;
    },
    async redirect({ 
      url, 
      baseUrl 
    }: {
      url: string;
      baseUrl: string;
    }) {
      console.debug('[Auth] redirect callback', { url, baseUrl });
      // If the user is logging out, redirect to home page
      if (url === `${baseUrl}/api/auth/signout` || url === `${baseUrl}/api/auth/signout?callbackUrl=%2F`) {
        return baseUrl;
      }
      // Otherwise, redirect to dashboard after login
      return `${baseUrl}/dashboard`;
    },
    async session({ 
      session, 
      token 
    }: {
      session: Session;
      token: JWT;
    }) {
      console.debug('[Auth] session callback', { session, token });
      if (session.user) {
        session.user.id = token.sub ?? "";
      }
      return session;
    },
  },
};

// Create NextAuth instance and export handlers
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);