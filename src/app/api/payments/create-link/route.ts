// app/api/payments/create-link/route.ts
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8888';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get auth token from request headers (if you have authentication)
    const authHeader = request.headers.get('authorization');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add auth header if present
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }
    
    const response = await fetch(`${BACKEND_URL}/payments/create-link`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const result = await response.json();

    // Unwrap backend response if needed
    let frontendResult = result;
    if (
      result &&
      typeof result === 'object' &&
      'data' in result &&
      typeof result.data === 'object' &&
      'success' in result.data
    ) {
      frontendResult = result.data;
    }

    if (!response.ok || frontendResult.success === false) {
      return NextResponse.json(
        {
          success: false,
          message: frontendResult.message || result.message || `Backend error: ${response.status}`,
        },
        { status: response.status }
      );
    }
    
    return NextResponse.json(frontendResult);
  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderCode = searchParams.get('orderCode');
    
    if (!orderCode) {
      return NextResponse.json(
        { success: false, message: 'Order code is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/payments/info/${orderCode}`);
    
    if (!response.ok) {
      const errorResult = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          message: errorResult.message || `Backend error: ${response.status}` 
        },
        { status: response.status }
      );
    }
    
    const result = await response.json();

    // Unwrap backend response if needed
    let frontendResult = result;
    if (
      result &&
      typeof result === 'object' &&
      'data' in result &&
      typeof result.data === 'object' &&
      'success' in result.data
    ) {
      frontendResult = result.data;
    }

    return NextResponse.json(frontendResult);
  } catch (error) {
    console.error('Payment info API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
