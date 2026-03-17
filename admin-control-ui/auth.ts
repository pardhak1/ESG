import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';


export const { auth, signIn, signOut } = NextAuth({
  ...authConfig, providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z.object({ email: z.string().email(), password: z.string().min(6) }).safeParse(credentials);
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = {
            id: "1234",
            email: "maduri.ramadoss@esgworks.com",
            name: 'Maduri',
            password: "12345678"
          };
          if (!user) return null;

          const passwordsMatch = true;
          //const passwordsMatch = email === user.email && password === user.password;
          //const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user;
        }
        return null;
      },

    }),],
});