'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth'

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function updateTrayStations(prevState: string | undefined, formData: FormData) {

    const kitCode = formData.get('kitCode');
    const trayCode = formData.get('trayCode');
    const workStationName = formData.get('workStationName');
    const rows = formData.get('rows');
    const cols = formData.get('cols');

    console.log(`updateTrayStations --> ${kitCode} - ${trayCode} - ${workStationName} - ${cols} - ${rows}`);
    const requestBody = {
        workStationName: workStationName,
        kitCode: kitCode,
        trayCodes: [trayCode, "DUMMy"],
        rows: rows,
        cols: cols
    }
    const res = await fetch(`http://localhost:8001/api/scan/cfg_line/stations`, {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    })
    if (res.ok) {
        const data = await res.json()
        console.log(JSON.stringify(data))
        return data.message
    } else {
        const data = await res.json()
        console.log(JSON.stringify(data))
        return data.message;
    }
}

export async function printTrayLabel(prevState: string | undefined, formData: FormData) {

    const requestBody = {
        trayLabel: formData.get('trayLabel'),
        printerName: formData.get('printerName'),
    }
    const res = await fetch('http://localhost:8001/api/scan/print/traylabel', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    })
    if (res.ok) {
        const data = await res.json()
        console.log(JSON.stringify(data))
        return data.message
    } else {
        const data = await res.json()
        console.log(JSON.stringify(data))
        return data.message;
    }
}

export async function printCabinetLabel(prevState: string | undefined, formData: FormData) {


    const requestBody = {
        cabinetLabel: formData.get('cabinetLabel'),
        printerName: formData.get('printerName'),
    }
    const res = await fetch('http://localhost:8001/api/scan/print/cabinetlabel', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    })
    if (res.ok) {
        const data = await res.json()
        console.log(JSON.stringify(data))
        return data.message
    } else {
        const data = await res.json()
        console.log(JSON.stringify(data))
        return data.message;
    }

}

export async function printCartonLabel(prevState: string | undefined, formData: FormData) {

    const requestBody = {
        cartonLabel: formData.get('cartonLabel'),
        printerName: formData.get('printerName'),
    }
    const res = await fetch('http://localhost:8001/api/scan/print/cartonLabel', {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    })
    if (res.ok) {
        const data = await res.json()
        console.log(JSON.stringify(data))
        return data.message
    } else {
        const data = await res.json()
        console.log(JSON.stringify(data))
        return data.message;
    }

}

