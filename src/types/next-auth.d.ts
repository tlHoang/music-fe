import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

interface IUser {
  _id: string;
  email: string;
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    access_token: string;
    refresh_token: string;
    user: IUser;
    access_expire: number;
    error: string;
  }
}

declare module "next-auth" {
  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends IUser {}

  /**
   * The shape of the account object returned in the OAuth providers' `account` callback,
   * Usually contains information about the provider being used, like OAuth tokens (`access_token`, etc).
   */
  // interface Account {}

  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: User;
    access_token: string;
    refresh_token: string;
    access_expire: number;
    error: string;
  }
}
