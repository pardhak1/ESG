'use client';
import { printTrayLabel } from '@/app/lib/actions';
import Link from 'next/link';
import {
  PrinterIcon,
  QrCodeIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { useActionState } from 'react';

export default function Form() {
  const [message, formAction, isPending] = useActionState(
    printTrayLabel,
    undefined,
  );

  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6">
        {/* Tray Name */}
        <div className="mb-4">
          <label htmlFor="trayLabel" className="mb-2 block text-sm font-medium">
            Tray Label
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="trayLabel"
                name="trayLabel"
                type="string"
                placeholder="Enter Tray Label"
                required
                minLength={6}
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              />
              <QrCodeIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="printerName" className="mb-2 block text-sm font-medium">
            Printer Name
          </label>
          <div className="relative mt-2 rounded-md">
            <div className="relative">
              <input
                id="printerName"
                name="printerName"
                type="string"
                placeholder="Enter Printer Name"
                required
                minLength={3}
                className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              />
              <PrinterIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
            </div>
          </div>
        </div>

      </div>
      {
        message && (
          <div
            className="flex h-8 items-end space-x-1"
            aria-live="polite"
            aria-atomic="true"
          >
            {message.includes("Successfully") && (
              <>
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-500">{message}</p>
              </>
            )}

            {(message.includes("Failed") || message.includes("Invalid")) && (
              <>
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-500">{message}</p>
              </>
            )}
          </div>)}
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/reprints"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" aria-disabled={isPending}>Print Tray Label</Button>
      </div>
    </form>
  );
}
