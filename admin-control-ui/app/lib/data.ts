export async function fetchMasterKits() {
    const res = await fetch('http://localhost:8001/api/scan/master_kits', {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
        }
    })
    if (res.ok) {
        const data = await res.json()
        console.log(JSON.stringify(data))
        return data.data
    } else {
        const data = await res.json()
        console.log(JSON.stringify(data))
        return [];
    }
}

export async function fetchMasterTrays({ kitCode }: { kitCode: string }) {
    const res = await fetch(`http://localhost:8001/api/scan/master_kits/${kitCode}/master_trays`, {
        method: "GET",
        headers: {
            'Content-Type': 'application/json',
        }
    })
    if (res.ok) {
        const data = await res.json()
        console.log(JSON.stringify(data))
        return data.data
    } else {
        const data = await res.json()
        console.log(JSON.stringify(data))
        return [];
    }

}

export async function FetchMasterKits() {
    return [

        {
            "kit_id": 1,
            "kit_code": "GAVITSP292",
            "kit_desc": "Avaira Vitality Sphere 292 1-Tray Kit",
            "kit_upc": "196334481711",
            "lens_count": 292,
            "tray_count": 1,
            "col_count": 13,
            "row_count": 25,
            "cfg_line_id": 0
        },
        {
            "kit_id": 2,
            "kit_code": "GBIOEN292",
            "kit_desc": "Biofinity Energys 292 1-Tray Kit",
            "kit_upc": "192529666307",
            "lens_count": 292,
            "tray_count": 1,
            "col_count": 13,
            "row_count": 25,
            "cfg_line_id": 0
        },
        {
            "kit_id": 3,
            "kit_code": "GMISIGHT630",
            "kit_desc": "MiSight 630 1-Tray Kit",
            "kit_upc": "196334481490",
            "lens_count": 63,
            "tray_count": 1,
            "col_count": 3,
            "row_count": 21,
            "cfg_line_id": 0
        },
        {
            "kit_id": 4,
            "kit_code": "GC1DSP1080",
            "kit_desc": "CLARITI SPHERE 1080 2-Tray Kit",
            "kit_upc": "196334514570",
            "lens_count": 108,
            "tray_count": 2,
            "col_count": 3,
            "row_count": 18,
            "cfg_line_id": 0
        },
        {
            "kit_id": 5,
            "kit_code": "GRBC1DSP1080",
            "kit_desc": "RAY-BAN SPHERE 1080 2-Tray Kit",
            "kit_upc": "196334531478",
            "lens_count": 108,
            "tray_count": 2,
            "col_count": 3,
            "row_count": 18,
            "cfg_line_id": 0
        },
        {
            "kit_id": 6,
            "kit_code": "GSERENSP292",
            "kit_desc": "Serenity Sphere 292 1-Tray Kit",
            "kit_upc": "192529716675",
            "lens_count": 292,
            "tray_count": 1,
            "col_count": 13,
            "row_count": 25,
            "cfg_line_id": 0
        },
        {
            "kit_id": 7,
            "kit_code": "GSOFMEDS1D540",
            "kit_desc": "Select 1-Day Sphere 540 2-Tray Kit",
            "kit_upc": "196334802479",
            "lens_count": 108,
            "tray_count": 2,
            "col_count": 3,
            "row_count": 18,
            "cfg_line_id": 0
        },
        {
            "kit_id": 8,
            "kit_code": "GBIOXRT260",
            "kit_desc": "BIOFINITY XR TORIC 1-TRAY KIT",
            "kit_upc": "192529666383",
            "lens_count": 260,
            "tray_count": 1,
            "col_count": 13,
            "row_count": 25,
            "cfg_line_id": 0
        },
        {
            "kit_id": 10,
            "kit_code": "CLTBOXA",
            "kit_desc": "CLARITI TORIC 3240 - BOX A",
            "kit_upc": "192529667632",
            "lens_count": 324,
            "tray_count": 6,
            "col_count": 3,
            "row_count": 18,
            "cfg_line_id": 0
        },
        {
            "kit_id": 11,
            "kit_code": "CLTBOXB",
            "kit_desc": "CLARITI TORIC 3240 - BOX B",
            "kit_upc": "192529667625",
            "lens_count": 324,
            "tray_count": 6,
            "col_count": 3,
            "row_count": 18,
            "cfg_line_id": 0
        },
        {
            "kit_id": 12,
            "kit_code": "GBIOSP309",
            "kit_desc": "Biofinity Sphere & XR 309 1-Tray Kit",
            "kit_upc": "192529666321",
            "lens_count": 309,
            "tray_count": 1,
            "col_count": 13,
            "row_count": 25,
            "cfg_line_id": 0
        },
        {
            "kit_id": 13,
            "kit_code": "GBIOSPCAN309",
            "kit_desc": "Biofinity Sphere + XR CANADA 1-Tray Kit",
            "kit_upc": "196334579791",
            "lens_count": 309,
            "tray_count": 1,
            "col_count": 13,
            "row_count": 25,
            "cfg_line_id": 0
        },
        {
            "kit_id": 14,
            "kit_code": "GBIOTRC858",
            "kit_desc": "Biofinity Toric 858 3-Tray Kit",
            "kit_upc": "192529666352",
            "lens_count": 858,
            "tray_count": 3,
            "col_count": 13,
            "row_count": 25,
            "cfg_line_id": 0
        },
        {
            "kit_id": 15,
            "kit_code": "GAVITTRC502",
            "kit_desc": "Avaira Vitality Toric 502 2-Tray Kit",
            "kit_upc": "196334481698",
            "lens_count": 502,
            "tray_count": 2,
            "col_count": 13,
            "row_count": 25,
            "cfg_line_id": 0
        },
        {
            "kit_id": 16,
            "kit_code": "GBIOTRC502",
            "kit_desc": "Biofinity Toric 502 2-Tray Kit",
            "kit_upc": "192529666338",
            "lens_count": 502,
            "tray_count": 2,
            "col_count": 13,
            "row_count": 25,
            "cfg_line_id": 0
        },
        {
            "kit_id": 17,
            "kit_code": "GAVITTRC858",
            "kit_desc": "Avaira Vitality Toric 858 3-Tray Kit",
            "kit_upc": "192529666291",
            "lens_count": 858,
            "tray_count": 3,
            "col_count": 13,
            "row_count": 25,
            "cfg_line_id": 0
        },
        {
            "kit_id": 18,
            "kit_code": "GBIOTRC624",
            "kit_desc": "Biofinity Toric 624 CAN 2-Tray Kit",
            "kit_upc": "192529666345",
            "lens_count": 624,
            "tray_count": 2,
            "col_count": 13,
            "row_count": 25,
            "cfg_line_id": 0
        },
        {
            "kit_id": 19,
            "kit_code": "GBIOMF559",
            "kit_desc": "Biofinity MF 559 2-Tray Kit",
            "kit_upc": "192529666314",
            "lens_count": 559,
            "tray_count": 2,
            "col_count": 13,
            "row_count": 25,
            "cfg_line_id": 0
        },
        {
            "kit_id": 20,
            "kit_code": "GAVITTRC624",
            "kit_desc": "Serenity Toric 624 2-Tray Industry Kit",
            "kit_upc": "196334531904",
            "lens_count": 624,
            "tray_count": 2,
            "col_count": 13,
            "row_count": 25,
            "cfg_line_id": 0
        },
        {
            "kit_id": 21,
            "kit_code": "GBIOMFCAN282",
            "kit_desc": "Biofinity Multi-Focal 282 1-Tray Kit",
            "kit_upc": "196334531720",
            "lens_count": 282,
            "tray_count": 1,
            "col_count": 13,
            "row_count": 25,
            "cfg_line_id": 0
        },
        {
            "kit_id": 22,
            "kit_code": "GMDENGY1190",
            "kit_desc": "MyDay Energys Sphere 1190 2-Tray Kit",
            "kit_upc": "196334477554",
            "lens_count": 119,
            "tray_count": 2,
            "col_count": 3,
            "row_count": 21,
            "cfg_line_id": 0
        },
        {
            "kit_id": 23,
            "kit_code": "GMDSP595",
            "kit_desc": "MYDAY SPHERE / MDS 595",
            "kit_upc": "192529666420",
            "lens_count": 119,
            "tray_count": 2,
            "col_count": 3,
            "row_count": 21,
            "cfg_line_id": 0
        },
        {
            "kit_id": 24,
            "kit_code": "GMDMF2430",
            "kit_desc": "MYDAY MULTIFOCAL 2430",
            "kit_upc": "196334477493",
            "lens_count": 243,
            "tray_count": 4,
            "col_count": 3,
            "row_count": 21,
            "cfg_line_id": 0
        },
        {
            "kit_id": 25,
            "kit_code": "GMDT1860",
            "kit_desc": "MyDay Toric 1860 6-Tray Kit",
            "kit_upc": "196334532574",
            "lens_count": 372,
            "tray_count": 6,
            "col_count": 3,
            "row_count": 21,
            "cfg_line_id": 0
        },
        {
            "kit_id": 26,
            "kit_code": "MDTBOXA",
            "kit_desc": "MyDay Toric 3780 Kit A 6-Tray Kit",
            "kit_upc": "196334477516",
            "lens_count": 378,
            "tray_count": 6,
            "col_count": 3,
            "row_count": 21,
            "cfg_line_id": 0
        },
        {
            "kit_id": 27,
            "kit_code": "MDTBOXB",
            "kit_desc": "MyDay Toric 3780 Kit B 6-Tray Kit",
            "kit_upc": "196334477523",
            "lens_count": 378,
            "tray_count": 6,
            "col_count": 3,
            "row_count": 21,
            "cfg_line_id": 0
        },
        {
            "kit_id": 9,
            "kit_code": "GC1DMF2430",
            "kit_desc": "CLARITI MULTI-FOCAL 2430 4D IK",
            "kit_upc": "196334802516",
            "lens_count": 243,
            "tray_count": 4,
            "col_count": 3,
            "row_count": 21,
            "cfg_line_id": 0
        }
    ]
}

export async function FetchMasterTrays({ kitCode }: { kitCode: string; }) {
    return [
        {
            "tray_id": 1,
            "kit_id": 1,
            "tray_kit_code": "AVITSP292-UPC-T1",
            "tray_number": 1
        }
    ]
}