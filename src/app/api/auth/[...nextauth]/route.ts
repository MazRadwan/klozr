import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { db } from '@/lib/db';
import { customers } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';

// NextAuth v5 with App Router requires this specific auth config pattern
export const { handlers, auth, signIn, signOut } = NextAuth({
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
        const user = await db.select().from(customers).where(eq(customers.email, email)).limit(1).then(result => result[0]);
        console.debug('[Auth] DB returned user:', user);
        const bcrypt = await import('bcryptjs');
        if (user) {
          if (user.passwordHash == null) {
            // Federated user wants to set a password (upgrade to regular account)
            const hash = await bcrypt.hash(password, 10);
            await db.update(customers)
              .set({ passwordHash: hash })
              .where(eq(customers.email, email)).run?.();
            return { id: user.id, email: user.email, name: user.name };
          } else if (typeof user.passwordHash === 'string' && await bcrypt.compare(password, user.passwordHash)) {
            // Regular login
            console.debug('[Auth] Password match succeeded for email:', email);
            return { id: user.id, email: user.email, name: user.name };
          }
          // Password incorrect or not set
          console.warn('[Auth] authorize failed for email:', email);
          return null;
        } else {
          // No user found, create new
          const hash = await bcrypt.hash(password, 10);
          const newId = crypto.randomUUID();
          await db.insert(customers).values({
            id: newId,
            name: '', // Optionally prompt for name
            email,
            phone: '',
            status: 'Active',
            createdAt: new Date().toISOString(),
            passwordHash: hash,
          }).run?.();
          return { id: newId, email, name: '' };
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
  secret: process.env.NEXTAUTH_SECRET || 'my-temporary-secret-for-development',
  theme: { colorScheme: 'auto' },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.debug('[Auth] signIn callback', { user, account, profile, email, credentials });
      // Insert federated users (Google/GitHub) into customers table if not already present
      if ((account?.provider === 'google' || account?.provider === 'github') && user?.email) {
        // Check if the user already exists
        const existing = await db.select().from(customers).where(eq(customers.email, user.email)).limit(1);
        if (!existing.length) {
          await db.insert(customers).values({
            id: user.id || crypto.randomUUID(),
            name: user.name || '',
            email: user.email,
            phone: '', // Optionally prompt for phone later
            status: 'Active',
            createdAt: new Date().toISOString(),
            passwordHash: null,
          }).run?.(); // .run() for drizzle-orm, but safe if not present
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      console.debug('[Auth] jwt callback', { token, user, account, profile, isNewUser });
      return token;
    },
    async redirect({ url, baseUrl }) {
      console.debug('[Auth] redirect callback', { url, baseUrl });
      // If the user is logging out, redirect to home page
      if (url === `${baseUrl}/api/auth/signout` || url === `${baseUrl}/api/auth/signout?callbackUrl=%2F`) {
        return baseUrl;
      }
      // Otherwise, redirect to dashboard after login
      return `${baseUrl}/dashboard`;
    },
    async session({ session, token }) {
      console.debug('[Auth] session callback', { session, token });
      session.user.id = token.sub ?? "";
      return session;
    },
  },
});

// The correct export for NextAuth v5 in App Router
export const GET = handlers.GET;
export const POST = handlers.POST;
