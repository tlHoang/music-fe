// import { auth } from "@/auth";

// export default auth((req) => {
//   // Allow unauthenticated access to specific routes
//   const publicRoutes = ["/login", "/register", "/verify"];
//   if (publicRoutes.includes(req.nextUrl.pathname)) {
//     return;
//   }

//   // Redirect unauthenticated users to the login page
//   if (!req.auth) {
//     // if (!req.auth && req.nextUrl.pathname !== "/login") {
//     const newUrl = new URL("/login", req.nextUrl.origin);
//     return Response.redirect(newUrl);
//   }
// });

import { auth } from "@/auth";

export default auth((req) => {
  const publicRoutes = [
    "/login",
    "/register",
    "/verify",
    "/track/",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublicRoute = publicRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return;
  }
  // const publicRoutes = ["/login", "/register", "/verify/"];
  // if (publicRoutes.includes(req.nextUrl.pathname)) {
  //   return;
  // }
  if (!req.auth) {
    // if (!req.auth && req.nextUrl.pathname !== "/login") {
    const newUrl = new URL("/login", req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

// export const config = {
//   // matcher: ["/((?!_next/static|_next/image|favicon.ico|register|verify).*)"],
//   matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
// };
