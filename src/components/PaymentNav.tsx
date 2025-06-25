'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CreditCard, TestTube, DollarSign } from 'lucide-react';

export function PaymentNav() {
  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Payment Features</h2>
        <div className="flex space-x-4">
          <Link href="/payment-test">
            <Button variant="outline" size="sm">
              <TestTube className="w-4 h-4 mr-2" />
              Test Payment
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline" size="sm">
              <DollarSign className="w-4 h-4 mr-2" />
              Pricing
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
