'use client';
import { useEffect, useState } from 'react';
import {
    PrinterIcon,
    UserCircleIcon,
    QrCodeIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { ChangeEvent } from 'react';
import { Button } from '@/app/ui/button';
import { PlanogramData, PlanogramSelectedCell, Planogram } from '@/app/lib/definitions';

export default function StationForm({ kitCode, trayCode }: { kitCode: string; trayCode: string }) {

    const [targetStationName, setTargetStationName] = useState('');
    const [planogram, setPlanogram] = useState<PlanogramData[]>([]);
    const [selectedCells, setSelectedCells] = useState<PlanogramSelectedCell[]>([]);
    const [isLoadingStation, setIsLoadingStation] = useState<boolean>(false); // Loading state for station selection
    const [isLoadingSubmit, setIsLoadingSubmit] = useState<boolean>(false); // Loading state for submission

    // Calculate the number of columns and rows dynamically
    const columns = Math.max(...planogram.map((cell) => cell.pos_col), 0);
    const rows = Math.max(...planogram.map((cell) => cell.pos_row), 0);
    const workStationIds = Array.from({ length: 6 }, (_, i) => i + 1);


    const handleTargetStationChange = async (event: ChangeEvent<HTMLSelectElement>) => {
        const station = event.target.value;
        setTargetStationName(station);
    };

    // Fetch planogram data when a station is selected
    const loadPlanogram = async () => {
        setIsLoadingStation(true);

        try {
            const response = await fetch(`http://localhost:8001/api/scan/planogram/${kitCode}/${trayCode}`);
            const planogram: Planogram = await response.json();
            setPlanogram(planogram.data);
        } catch (error) {
            console.error('Error fetching planogram:', error);
        } finally {
            setIsLoadingStation(false); // Stop loading
        }
    };

    // Handle cell selection
    const handleCellClick = (pos_col: number, pos_row: number) => {
        const cell = planogram.find(
            (c) => c.pos_col === pos_col && c.pos_row === pos_row
        );

        // Do nothing if the cell record is not available
        if (!cell) return;

        const isSelected = selectedCells.some(
            (c) => c.pos_col === pos_col && c.pos_row === pos_row
        );

        if (isSelected) {
            setSelectedCells(selectedCells.filter((c) => !(c.pos_col === pos_col && c.pos_row === pos_row)));
        } else {
            setSelectedCells([...selectedCells, cell]);
        }
    };

    const handleClearSelections = () => {
        setSelectedCells([]);
        setTargetStationName('');
    }

    // Handle column selection
    const handleColumnClick = (pos_col: number) => {
        const columnCells = planogram.filter((cell) => cell.pos_col === pos_col);
        const allSelected = columnCells.every((cell) =>
            selectedCells.some((c) => c.pos_col === cell.pos_col && c.pos_row === cell.pos_row)
        );

        if (allSelected) {
            setSelectedCells(selectedCells.filter((c) => c.pos_col !== pos_col));
        } else {
            const newSelectedCells = columnCells.filter(
                (cell) => !selectedCells.some((c) => c.pos_col === cell.pos_col && c.pos_row === cell.pos_row)
            );
            setSelectedCells([...selectedCells, ...newSelectedCells]);
        }
    };

    // Submit selected cells to the API
    const handleSubmit = async () => {
        try {

            setIsLoadingSubmit(true);
            const data = {
                kitCode: kitCode,
                trayCode: trayCode,
                targetStation: targetStationName,
                configLineIds: selectedCells.filter(cell => cell.cfg_line_id).map(cell => cell.cfg_line_id)
            }
            console.log(JSON.stringify(data))
            const response = await fetch(`http://localhost:8001/api/scan/cfg_line/stations`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            console.log('Edit API response:', result);
        } catch (error) {
            console.error('Error submitting edit:', error);
        } finally {
            setIsLoadingSubmit(false); // Stop loading
            loadPlanogram();
            setSelectedCells([]);
            setTargetStationName('');
        }
    };

    useEffect(() => {
        loadPlanogram();
    }, []);

    // loadPlanogram();
    return (
        <div>
            {!isLoadingStation && planogram.length > 0 && (
                <div className="mt-6 flow-root">
                    <div className="inline-block min-w-full align-middle">
                        <div className="rounded-lg bg-gray-50 p-2 md:pt-0">

                            <table className="hidden min-w-full text-gray-900 md:table">
                                <thead className="rounded-lg text-center text-sm font-normal">
                                    <tr>
                                        {Array.from({ length: columns }, (_, i) => (
                                            <th scope="col" className="px-4 py-5 font-medium sm:pl-6" key={i + 1} onClick={() => handleColumnClick(i + 1)}>
                                                Column {i + 1}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {Array.from({ length: rows }, (_, rowIndex) => (
                                        <tr key={rowIndex + 1} className="w-full border-b py-3 text-sm last-of-type:border-none [&:first-child>td:first-child]:rounded-tl-lg [&:first-child>td:last-child]:rounded-tr-lg [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg">
                                            {Array.from({ length: columns }, (_, colIndex) => {
                                                const cell = planogram.find(
                                                    (c) => c.pos_col === colIndex + 1 && c.pos_row === rowIndex + 1
                                                );
                                                const isSelected = selectedCells.some(
                                                    (c) => c.pos_col === colIndex + 1 && c.pos_row === rowIndex + 1
                                                );
                                                const isCellAvailable = !!cell;
                                                return (
                                                    <td className="whitespace-nowrap px-3 py-3"
                                                        key={`${colIndex + 1}-${rowIndex + 1} `}
                                                        onClick={() => isCellAvailable && handleCellClick(colIndex + 1, rowIndex + 1)}
                                                        style={{
                                                            backgroundColor: isSelected ? 'lightblue' : 'white',
                                                            cursor: isCellAvailable ? 'pointer' : 'not-allowed',
                                                            opacity: isCellAvailable ? 1 : 0.6,
                                                            textAlign: 'center',
                                                            verticalAlign: 'middle',
                                                            padding: '10px'
                                                        }}
                                                    >
                                                        {cell ? cell.ws_name || 'Unknown Station' : '-'}
                                                        <br></br>
                                                        {cell ? cell.lens_upc || 'Unknown UPC' : '-'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            {selectedCells.length > 0 && (
                <form >
                    <div className="rounded-md bg-gray-50 p-4 md:p-6">
                        <div className="mb-4">
                            <label htmlFor="trayLabel" className="mb-2 block text-sm font-medium">
                                Target Work Station
                            </label>
                            <div className="relative mt-2 rounded-md">
                                <div className="relative">
                                    <select
                                        id="targetStationName"
                                        name="targetStationName"
                                        className="peer block w-full cursor-pointer rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
                                        value={targetStationName}
                                        onChange={handleTargetStationChange}
                                        aria-describedby="workStationName-error"
                                        required
                                        size={1}
                                    >
                                        <option value="" disabled>
                                            Select Target Work Station
                                        </option>

                                        {workStationIds.map((workStationId) => (
                                            <option key={workStationId} value={workStationId}>
                                                Station {workStationId}
                                            </option>
                                        ))}

                                    </select>
                                    <QrCodeIcon className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-4">
                            <Button type="button" disabled={!(selectedCells.length > 0 || targetStationName != "")} onClick={handleClearSelections}>Clear</Button>
                            <Button type="button" disabled={isLoadingSubmit || selectedCells.length === 0 || targetStationName == ""} onClick={handleSubmit}>{isLoadingSubmit ? 'Submitting...' : 'Submit Edit'}</Button>
                            {isLoadingSubmit && <span style={{ marginLeft: '10px' }}>Submitting...</span>}
                        </div>
                    </div >
                </form>)}
        </div>
    );
}
