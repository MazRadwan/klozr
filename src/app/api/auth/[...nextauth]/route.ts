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
        if (user && typeof user.passwordHash === 'string' && await compare(password, user.passwordHash)) {
          console.debug('[Auth] Password match succeeded for email:', email);
          return { id: user.id, email: user.email, name: user.name };
        }
        console.warn('[Auth] authorize failed for email:', email);
        return null;
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
      return true;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      console.debug('[Auth] jwt callback', { token, user, account, profile, isNewUser });
      return token;
    },
    async redirect({ url, baseUrl }) {
      console.debug('[Auth] redirect callback', { url, baseUrl });
      return url;
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
