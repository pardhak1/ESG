'use client';
import { updateTrayStations } from '@/app/lib/actions';
import Link from 'next/link';
import {
    PrinterIcon,
    UserCircleIcon,
    QrCodeIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';
import { useActionState } from 'react';

export default function Planogram({ }: {}) {

    const [message, formAction, isPending] = useActionState(
        updateTrayStations,
        undefined,
    );

    const rows = Array.from({ length: 30 }, (_, i) => i + 1);
    const cols = Array.from({ length: 10 }, (_, i) => i + 1);
    const dynamicTableData = [
        ["Col 1 Row 1", "Col 2 Row 1"],
        ["Col 1 Row 2", "Col 2 Row 2"]
    ]
    return (
        <table style={{}}>
            <thead>
                <th key={`header-1`} style={{ width: `1600px` }}>Col 1</th>
                <th key={`header-1`} style={{ width: `1600px` }}>Col 2</th>
            </thead>
            <tbody style={{}}>
                {[...dynamicTableData].map((row, rowIndex) => (

                    <tr key={rowIndex}>
                        {row.map((cellValue, cellIndex) => (
                            <td key={cellIndex}
                            >
                                {cellValue}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>

        </table>
    );
}
