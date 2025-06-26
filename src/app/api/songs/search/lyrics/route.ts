import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    
    // Get the search query from URL parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Forward the request to the backend
    const backendUrl = `${process.env.BACKEND_URL}/songs/search/lyrics?query=${encodeURIComponent(query)}`;
    const headers: HeadersInit = {};
    
    if (token?.user?.access_token) {
      headers['Authorization'] = `Bearer ${token.user.access_token}`;
    }

    const response = await fetch(backendUrl, { headers });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in songs lyrics search API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
