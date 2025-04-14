import NextAuth, { AuthError, CredentialsSignin, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "./lib/zod";
import { ZodError } from "zod";
import { sendRequest } from "./utils/api";
import { IUser } from "./types/next-auth";

class CustomSignInError extends CredentialsSignin {
  constructor(message: string) {
    super(message);
    this.code = message;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const { email, password } = credentials;
        const res = await sendRequest<IBackendRes<ILogin>>({
          method: "POST",
          url: `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
          body: {
            email,
            password,
          },
        });
        if (res.ok) {
          return res.data?.user || null;
        } else if (res.statusCode === 401) {
          if (res.message === "Invalid email or password") {
            throw new CustomSignInError("InvalidEmailOrPassword");
          } else if (res.message === "Account is not activated") {
            throw new CustomSignInError("AccountIsNotActivated");
          } else {
            throw new CustomSignInError("InvalidCredentials");
          }
        } else {
          throw new CustomSignInError("InternalServerError");
          // throw new AuthError("Internal server error");
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: async ({ auth }) => {
      return !!auth;
    },
    jwt({ token, user }) {
      if (user) {
        token.user = user as IUser;
      }
      return token;
    },
    session({ session, token }) {
      (session.user as IUser) = token.user;
      return session;
    },
  },
});
