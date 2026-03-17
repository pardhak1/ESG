module.exports = {
  //Simple Interface to localize any prints we neeed to make
  enumPrinter: (size) => {
    //FROM ikb.cfg where cfg_name =
    // Return first printer of matching media size
    //TODO: Account for different printers of the same media size
    if (size != "large" || size != "small") {
      console.log("Invalid printer specification passed, returning");
      return { status: -1, message: "invalid specification" };
    }
    if (size == "small") {
      query = "SELECT * FROM ikb.cfg where cfg_name = 'small' LIMIT 1"; //TODO: hard limit to ensure we only return one printer; will need to address this query later if more printers are introducedf
      connection.query(query, [], (error, results, fields) => {
        //  console.log("Incomplete Workorder Results = " + JSON.parse(results))
        if (error) {
          console.log(error);
          next(
            res.status(500).json({
              success: 0,
              message: "Database connection errror",
            })
          );
        }

        console.log(results);

        results !== undefined &&
          results.forEach((element) => {
            body.push(element);
          });

        next(
          res.status(200).json({
            success: 1,
            data: body,
          })
        );
      });
    }
    if (size == "large") {
      query = "SELECT * FROM ikb.cfg where cfg_name = 'large' LIMIT 1";
      connection.query(query, [], (error, results, fields) => {
        //  console.log("Incomplete Workorder Results = " + JSON.parse(results))
        if (error) {
          console.log(error);
          next(
            res.status(500).json({
              success: 0,
              message: "Database connection errror",
            })
          );
        }

        console.log(results);

        results !== undefined &&
          results.forEach((element) => {
            body.push(element);
          });

        next(
          res.status(200).json({
            success: 1,
            data: body,
          })
        );
      });
    }
  },

  createPrint: (host, port, message) => {
    if (message == "") {
      console.log("Invalid Print passed");
      return;
    }
    let status = true;
    var socket = require("net").Socket();

    socket.on("error", (error) => {
      console.log("Printer Socket Connection Issue");
      status = false;
    });

    console.log("Message length: " + message["printmessage"].length);

    socket.connect(port, host, () => {
      console.log(`Connected to printer at ${host}:${port}`);

      // Combine all messages into one buffer and write once
      const fullMessage = message["printmessage"].join('');

      socket.write(fullMessage, () => {
        console.log("All data sent to printer");
        socket.end();
        console.log("Socket connection closed");
      });
    });

    socket.on("close", () => {
      console.log("Printer socket closed");
    });

    return status;
  },

  makeTrayLabel: (data) => {
    //small barcode for tray
    //Confirmed Works on small paper
    //We'll replace barcode data
    var out = [];
    data.forEach((element) => {
      out.push(`^XA
            // Barcode
            ^FO10,0
            ^BQ,2,7
            ^FDMA,${element["wo_traylabel"]}^FS
            // Text
            ^FT45,200
            ^A0N,15,15
            ^FD ${element["wo_traylabel"]}
            ^FS
        ^XZ`);
    });

    return { mediaSize: "small", printmessage: out };
  },

  makeCabinetLabel: (data) => {
    var out = [];
    //Packlot Label
    data.forEach((element) => {
      out.push(`^XA
            // Barcode
            ^FO10,0
            ^BQ,2,7
            ^FDMA,${element["wo_cabinetlabel"]}^FS
            // Text
            ^FT45,200
            ^A0N,20,20
            ^FD ${element["wo_cabinetlabel"]}
            ^FS
        ^XZ`);
    });
    return { mediaSize: "small", printmessage: out };
  },

  makePalletLabel: (data) => {
    var out = [];
    //Pallet Label - Full format label
    data.forEach((element) => {
      // Format current date as MM/DD/YYYY
      const now = new Date();
      const labelDate = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;

      out.push(`^XA
^PW830
^LL1218
^LS0
^FO544,32^GFA,04736,04736,00004,:Z64:
eJztw0EJAEAIADDl+ncyilFscF9BNljEX7aq6v2vVFXv3zLE+axC:CE19
^FT100,1165^A0B,54,52^FH\\^FDItem:^FS
^FT97,816^A0B,51,50^FH\\^FD${element["kit_code"]}^FS
^FT173,1165^A0B,51,50^FH\\^FDDescription:^FS
^FT170,816^A0B,39,38^FH\\^FD${element["kit_desc"]}^FS
^BY6,3,125^FT352,1078^BCB,,N,N
^FD>:${element["kit_code"]}^FS
^FO387,43^GB0,1133,4^FS
^FT592,1176^A0B,39,38^FH\\^FDSerial Number:^FS
^FT663,1067^A0B,51,50^FH\\^FD${element["wo_palletlabel"]}^FS
^BY3,3,50^FT757,1180^BCB,,N,N
^FD${element["wo_palletlabel"]}^FS
^FO792,43^GB0,1142,4^FS
^FO387,626^GB406,0,4^FS
^FO692,44^GB0,582,4^FS
^FT754,606^A0B,39,38^FH\\^FDLabel Date:^FS
^FT754,341^A0B,39,38^FH\\^FD${labelDate}^FS
^FT598,621^A0B,39,38^FH\\^FDLot:^FS
^FT440,621^A0B,39,38^FH\\^FDVendor:^FS
^FT440,1172^A0B,39,38^FH\\^FDPO:^FS
^FT530,1150^A0B,97,96^FH\\^FD${element["work_order"] || ""}^FS
^PQ1,0,1,Y^XZ`);
    });
    return { mediaSize: "large", printmessage: out };
  },

  genCartonCode: (data) => {
    var cabinet_label = data["cabinet_label"];
    var build_date = data["build_date"]; //Not until last scan is submitted
    var kit_code = data["kit_code"];
    var item_desc = data["item_desc"];
    var kit_upc = data["kit_upc"];
    var expiry_date = data["expiry_date"]; //Not until last scan is submitted
    var gs1_yr = expiry_date.substring(2, 4);
    var gs1_mo = expiry_date.substring(5, 7);
    var gs1_day = expiry_date.substring(8);

    let GS1 =
      "_10100" +
      kit_upc +
      "_117" +
      gs1_yr +
      gs1_mo +
      gs1_day +
      "_110" +
      cabinet_label;
    let packlot_expir = cabinet_label + gs1_yr + gs1_mo + gs1_day;

    var out2 = `^XA
 
    ^FO40,47   // Scaled field origin
    ^BXN,5,200,0,,1,_ // Scaled box field
    ^FD${GS1}^FS
    ^FO20,250   // Scaled field origin
    ^A0N,17,17   // Scaled font size
    ^FDDate of Build:^FS
    ^FO20,267   // Scaled field origin
    ^A0N,20,20   // Scaled font size
    ^FD${build_date}^FS //Date of Build
    ^FO20,304   // Scaled field origin
    ^A0N,17,17   // Scaled font size
    ^FDITEM:^FS
    ^FO20,321   // Scaled field origin
    ^A0N,20,20   // Scaled font size
    ^FD${kit_code}^FS //Kitcode
    ^FO20,358   // Scaled field origin
    ^A0N,17,17   // Scaled font size
    ^FDITEM DESC:^FS
    ^FO20,375   // Scaled field origin
    ^A0N,20,20   // Scaled font size
    ^FD${item_desc}^FS //Item Desc
    ^FO304,61   // Scaled field origin
    ^BY2   // Scaled barcode width
    ^BUN,71,Y,N   // Scaled UPC size
    ^FD${kit_upc}^FS
    ^FO290,200   // Scaled field origin
    ^BY1.3   // Scaled barcode width
    ^BCN,75,N,N,N  // Scaled Code 128 settings
    ^FD${packlot_expir}^FS //??
    ^FO268,301   // Scaled field origin
    ^A0N,20,20   // Scaled font size
    ^FD${cabinet_label}^FS //Packlot
    ^FO412,301   // Scaled field origin
    ^A0N,20,20   // Scaled font size
    ^FD${expiry_date}^FS //Expiry Date
    ^FO300,331   // Scaled field origin
    ^GB37,27,2^FS   // Scaled box settings
    ^FO305,338   // Scaled field origin
    ^A0N,17,17   // Scaled font size
    ^FDLOT^FS
    ^FO297,361   // Scaled field origin
    ^A0N,10,10   // Scaled font size
    ^FDBatch Code^FS
    ^FO466,338   // Scaled field origin
    ^A0N,17,17   // Scaled font size
    ^FDEXP^FS
    ^FO449,361   // Scaled field origin
    ^A0N,10,10   // Scaled font size
    ^FDUse-by-date^FS
^XZ`;
    return { mediaSize: "large", printmessage: [out2] };
  },
};
