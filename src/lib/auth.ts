import type { NextAuthOptions } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { slugify } from "@/lib/utils";

const baseAdapter = PrismaAdapter(prisma);

const customAdapter = {
  ...baseAdapter,
  async createUser(data: Omit<AdapterUser, "id">) {
    const base = slugify(data.email.split('@')[0]);

    let username = base;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
        username = `${base}_${counter}`;
        counter++;
    }

    return prisma.user.create({
        data: { email: data.email, username },
    }) as unknown as AdapterUser;
  },
} as Adapter;



export const authOptions: NextAuthOptions = {
  adapter: customAdapter,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) return null;
        if (!user.password) return null;  // OAuth users have no password

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!passwordMatch) return null;

        return { id: user.id, email: user.email, name: user.username };
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    })

  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Fetch username from DB — covers both Credentials and OAuth
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true },
        });
        token.username = dbUser?.username ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
