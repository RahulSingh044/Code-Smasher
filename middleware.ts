import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default clerkMiddleware((req: any) => {
  // Example: allow all requests to continue
  return NextResponse.next();
});

// Configure paths that should use the middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
