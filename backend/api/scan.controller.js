const connection = require("../config/database");
const printer = require("../utilities/printerInterface");

const nodemailer = require("nodemailer");

const bcrypt = require("bcrypt");
//   const { sign } = require("jsonwebtoken");

const jwt = require("jsonwebtoken");
// const cookieParser = require('cookie-parser');

process.on("unhandledRejection", (error, promise) => {
  console.log("Unhandled Rejection Occurred. Details: ", promise);
  console.log("The error is: ", error);
});

process.on("uncaughtException", (error) => {
  console.log("Uncaught Exception Occurred, The error is: ", error);
});

module.exports = {
  createScan: (req, res, next) => {
    const body = req.body;
    console.log("Scan creation function 1");
    console.log(body);

    // Extract relevant data from the request body
    let trayid = body["trayID"].trim();
    let pcol = body.pos["col"];
    let prow = body.pos["row"];
    let upc = body["upc"].trim();
    let exp = body["expir"].trim();
    let barcode = body["unparsed"].trim();
    let scandate = Math.floor(Date.now()); // remove milliseconds
    let lotnum = body["lotnum"].trim();
    let kitcode = body["kitcode"].trim();
    let traynum = body["traynumber"].trim();
    let ws_id = body["station"].trim();
    let upcVerify = body["upcVerify"];

    const clientIP = req.headers['x-forwarded-for'];

    // Query to check the current scan count for the given UPC
    let check_scan_count =
      "SELECT COUNT(*) as scan_count FROM wo_scan WHERE scan_upc = ? AND wo_tray_id = ?";

    // Query to insert a new scan
    let insert_scan =
      "INSERT INTO `wo_scan` (`wo_scan_id`, `wo_tray_id`, `pcol`, `prow`, `scan_upc`, `exp_date`, `barcode`, `scan_date`, `lens_lot`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    // Query to get lens description and position
    let lens_desc =
      "SELECT lens_desc, pos_col, pos_row FROM planogram WHERE lens_upc = ? AND kit_code = ? AND ws_number = ? AND tray_number = ? ORDER BY pos_row ASC, pos_col ASC";

    // First, check the current scan count
    connection.query(check_scan_count, [upc, trayid], (error, countResults) => {
      if (error) {
        console.log(error);
        return next(
          res.status(500).json({
            success: 0,
            message: "Database connection error",
          })
        );
      }

      const currentScanCount = countResults[0].scan_count;
      console.log(`Current scan count for UPC ${upc}: ${currentScanCount}`);

      // Now check if the lens is valid for this tray and station
      connection.query(
        lens_desc,
        [upc, kitcode, ws_id, traynum],
        (error, lensResults) => {
          if (error) {
            console.log(error);
            return next(
              res.status(500).json({
                success: 0,
                message: "Database connection error",
              })
            );
          }

          if (lensResults.length === 0) {
            console.log(
              "Submit Scan | No Matching lens found for provided station state!"
            );
            return res.status(400).json({
              success: -1,
              message: "Invalid Scan",
            });
          }

          // If the lens is valid, proceed with the insertion
          const maxAllowedScans = lensResults.length; // Assuming each result represents an allowed scan
          if (currentScanCount >= maxAllowedScans) {
            return res.status(400).json({
              success: -2,
              message: "Maximum scan count reached for this UPC",
            });
          }

          connection.query(
            insert_scan,
            ["0", trayid, pcol, prow, upc, exp, barcode, scandate, lotnum],
            (error, insertResults) => {
              if (error) {
                console.log(error);
                return next(
                  res.status(500).json({
                    success: 0,
                    message: "Database connection error",
                  })
                );
              }

              res.status(200).json({
                success: 1,
                data: lensResults,
                insertid: insertResults,
              });
            }
          );
        }
      );
    });
    if (upcVerify === false) { // body.upcVerify is false if unparsed barcode starts with 01 and does not contain upc
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
      });

      const mailOptions = {
        from: 'IKB_UPC_Mismatch@esgworks.com',
        to: 'it_infrastructure@esgworks.com',
        subject: 'IKB UPC Mismatch Submitted',
        text: `Scan submitted with 01 barcode and mismatched UPC.  Submitted scan information below.\n\nBarcode: ${body.unparsed}\nUPC: ${body.upc}\nTrayID: ${body.trayID}\nClient IP: ${clientIP}\n\n`
      };

      transporter.sendMail(mailOptions)
        .then((info) => {
          console.log(`Email sent: ${info.response}`);
        })
        .catch(console.error);
    }
  },

  validateScan: (req, res, next) => {
    const body = req.body;
    console.log("Scan creation function 2");
    console.log(body);

    // Extract relevant data from the request body
    let upc = req.params.upc;
    let kitcode = req.params.kitcode;
    let traynum = req.params.trayNumber;
    let ws_id = req.params.station;

    // Query to get lens description and position
    let lens_desc =
      "SELECT lens_desc, pos_col, pos_row FROM planogram WHERE lens_upc = ? AND kit_code = ? AND ws_number = ? AND tray_number = ? ORDER BY pos_row ASC, pos_col ASC";

    // Now check if the lens is valid for this tray and station
    connection.query(
      lens_desc,
      [upc, kitcode, ws_id, traynum],
      (error, lensResults) => {
        if (error) {
          console.log(error);
          return next(
            res.status(500).json({
              success: 0,
              message: "Database connection error",
            })
          );
        }

        if (lensResults.length === 0) {
          console.log(
            "Submit Scan | No Matching lens found for provided station state!"
          );
          return res.status(400).json({
            success: -1,
            message: "Invalid Scan",
          });
        }

        res.status(200).json({
          success: 1,
          data: lensResults,
        });
      }
    );
  },
  createTrayLabels: (req, res, next) => {
    //Receive WorkOrderID, query wo table, generate and insert needed traylabels
    //select work_order,wo_qty from wo where wo_id = 1;
    //gen wo_qty
  },
  beginWorkOrder: (req, res, next) => {
    //Set a workorder's startdate
    //receive woid as param; run update query

    //update wo set start_date = '' where wo_id = ''
    let wo = req.params["wo"];
    connection.query(
      `update wo set start_date = "` +
      Date.getTime() +
      " where wo_id = '" +
      wo +
      "'",
      [],
      (error, results, fields) => {
        //console.log("Returned Barcodes = " + JSON.stringify(results))
        if (error) {
          console.log(error);
          next(
            res.status(500).json({
              success: 0,
              message: "Database connection errror",
            })
          );
        }

        //console.log(results);

        next(
          res.status(200).json({
            success: 1,
            data: results,
          })
        );
      }
    );
  },
  printWorkOrder: (req, res, next) => {
    let wo = req.params["wo"];
    const printer_name = req.body.printer_name;
    const is_supervisor = req.body.is_supervisor || false;

    if (!printer_name) {
      return res.status(400).json({
        success: 0,
        message: "Printer name is required"
      });
    }

    // First, get printer details
    connection.query(
      `SELECT cfg_id, cfg_name, cfg_ipaddress, cfg_port FROM cfg WHERE cfg_type = 'printer' AND cfg_name = ?`,
      [printer_name],
      (printerError, printerResults) => {
        if (printerError) {
          console.log(printerError);
          return res.status(500).json({
            success: 0,
            message: "Database error fetching printer"
          });
        }

        if (!printerResults || printerResults.length === 0) {
          return res.status(404).json({
            success: 0,
            message: "Printer not found"
          });
        }

        const printerConfig = printerResults[0];
        const printer_ip = printerConfig.cfg_ipaddress;
        const printer_port = printerConfig.cfg_port;

        // Query based on supervisor status
        const query = is_supervisor
          ? `SELECT * FROM wo_tray WHERE wo_id = ? ORDER BY wo_traylabel ASC`
          : `SELECT * FROM wo_tray WHERE wo_id = ? AND (wo_traylabel_printdate IS NULL OR wo_traylabel_printdate = '') ORDER BY wo_traylabel ASC`;

        // Get the tray labels
        connection.query(
          query,
          [wo],
          (error, results, fields) => {
            if (error) {
              console.log(error);
              return res.status(500).json({
                success: 0,
                message: "Database error fetching tray labels"
              });
            }

            if (results.length === 0) {
              return res.status(400).json({
                success: 0,
                message: is_supervisor ? "No tray labels found" : "All tray labels have already been printed. Supervisor access required to reprint.",
                already_printed: !is_supervisor
              });
            }

            // Print all labels
            var tray_label = printer.makeTrayLabel(results);
            printer.createPrint(printer_ip, printer_port, tray_label);

            // Update printdate for all printed labels
            const currentTime = Date.now();
            const trayIds = results.map(r => r.wo_tray_id);

            if (trayIds.length > 0) {
              connection.query(
                `UPDATE wo_tray SET wo_traylabel_printdate = ? WHERE wo_tray_id IN (?)`,
                [currentTime, trayIds],
                (updateError) => {
                  if (updateError) {
                    console.error('Error updating printdate:', updateError);
                  }
                }
              );
            }

            res.status(200).json({
              success: 1,
              data: results,
              printed: results.length,
              message: "Print job sent successfully"
            });
          }
        );
      }
    );
  },

  getExistingScans: (req, res, next) => {
    //TODO: Implement this in scan submission

    const trayId = req.params.trayId;
    const stationId = req.params.stationId;
    const query = `
      SELECT ws.*, p.lens_desc
    FROM wo_scan ws
    JOIN planogram p ON ws.scan_upc = p.lens_upc
    WHERE ws.wo_tray_id = ? AND p.ws_id = ? group by wo_scan_id;
  `;

    connection.query(query, [trayId, stationId], (error, results) => {
      if (error) {
        console.log(error);
        return next(
          res.status(500).json({
            success: 0,
            message: "Database connection error",
          })
        );
      }

      res.status(200).json({
        success: 1,
        data: results,
      });
    });
  },

  printCartonLabel: (req, res, next) => {
    //Use large format printer for this
    //Need BuiltDate, KitCode, Item Desc, Packlot, Expiry,
    let kit_scandate = 0; //this is build date
    let exp_date = 0;
    //TODO: Implement printerEnum
    console.log("Print Carton Label Params | " + JSON.stringify(req.body));
    let cartonObj = req.body;

    const printer_ip = cartonObj.printer_ip;
    const printer_port = cartonObj.printer_port;
    cartonObj.printer_ip = null;
    cartonObj.printer_port = null;
    var cartonLabel = printer.genCartonCode(cartonObj);
    printer.createPrint(printer_ip, printer_port, cartonLabel);
    //printer.createPrint("10.10.100.113",6101,cartonLabel);
    console.log("Printed Carton ZPL: " + JSON.stringify(cartonLabel));
    console.log("post printer | Carton Label");
    next(
      res.status(200).json({
        success: 1,
      })
    );
  },

  reprintCartonLabel: (req, res, next) => {
    function formatDate(dateString) {
      // Extract year, month, and day from the string
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);

      // Combine them in the desired format
      return `${year}-${month}-${day}`;
    }

    let cartonLabel = req.params["cartonLabel"];
    const printer_name = req.body.printer_name;

    if (!printer_name) {
      return res.status(400).json({
        success: 0,
        message: "Printer name is required"
      });
    }

    let query = `SELECT
  distinct wc.wo_id as wo_id,
   wc.wo_cabinet_id as wo_cabinet_id,
   wc.wo_cartonlabel as wo_cartonlabel,
   wo.kit_code as wo_kit_code,
   wc.wo_cartonlabel_printdate as wo_cartonlabel_printdate,
   DATE_FORMAT(FROM_UNIXTIME(wk.wo_kit_scandate / 1000), '%Y%m%d%h%i%s') as kit_scandate,
   mk.kit_desc as mk_kit_desc,
   mk.kit_upc as mk_kit_upc,
   min(ws.exp_date) as exp_date
   from
    wo_scan ws 	inner join wo_tray wt on ws.wo_tray_id = wt.wo_tray_id
    inner join wo_kit wk on wt.wo_tray_id = wk.wo_tray_id
    inner join wo_cabinet wc on wk.wo_cabinet_id = wc.wo_cabinet_id
    inner join wo wo on wo.wo_id = wc.wo_id
    right join master_kit mk on wo.kit_code = mk.kit_code
   where wc.wo_cartonlabel = ? and ws.exp_date is not null and wk.wo_kit_scandate is not null 
   group by wk.wo_cabinet_id`;

    // First, get printer details
    connection.query(
      `SELECT cfg_id, cfg_name, cfg_ipaddress, cfg_port FROM cfg WHERE cfg_type = 'printer' AND cfg_name = ?`,
      [printer_name],
      (printerError, printerResults) => {
        if (printerError) {
          console.log(printerError);
          return res.status(500).json({
            success: 0,
            message: "Database error fetching printer"
          });
        }

        if (!printerResults || printerResults.length === 0) {
          return res.status(404).json({
            success: 0,
            message: "Printer not found"
          });
        }

        const printerConfig = printerResults[0];
        const printer_ip = printerConfig.cfg_ipaddress;
        const printer_port = printerConfig.cfg_port;

        // Now get carton label data
        connection.query(query, [cartonLabel], (error, results) => {
          if (error) {
            console.log(error);
            return res.status(500).json({
              success: 0,
              message: "Database connection error",
            });
          }

          if (results && results[0] && results[0]["wo_kit_code"]) {
            console.log("Reprint Label Results: " + JSON.stringify(results));
            //rebuild expected JSON
            const cartonObj = {
              kit_code: results[0]["wo_kit_code"],
              item_desc: results[0]["mk_kit_desc"],
              cabinet_label: results[0]["wo_cartonlabel"],
              expiry_date: formatDate(results[0]["exp_date"]),
              build_date: formatDate(results[0]["kit_scandate"]),
              kit_upc: results[0]["mk_kit_upc"],
            };

            var cartonLabelZPL = printer.genCartonCode(cartonObj);
            try {
              printer.createPrint(printer_ip, printer_port, cartonLabelZPL);
              res.status(200).json({
                success: 1,
                data: results,
                message: "Carton label reprinted successfully",
              });
            } catch (error) {
              console.error('Print error:', error);
              res.status(500).json({
                success: 0,
                data: results,
                message: "Unable to Connect to Printer. Check printer condition.",
              });
            }
          } else {
            console.log("Unable to find any carton with label");
            res.status(400).json({
              success: 0,
              data: results,
              message: "Cabinet Does not exist",
            });
          }
        });
      }
    );
  },

  checkTrayCompletion: (req, res, next) => {
    //Return true or false for a tray's completion
  },

  printCabinetLabel: (req, res, next) => {
    let wo = req.params["wo"];
    const printer_name = req.body.printer_name;
    const is_supervisor = req.body.is_supervisor || false;

    if (!printer_name) {
      return res.status(400).json({
        success: 0,
        message: "Printer name is required"
      });
    }

    // First, get printer details
    connection.query(
      `SELECT cfg_id, cfg_name, cfg_ipaddress, cfg_port FROM cfg WHERE cfg_type = 'printer' AND cfg_name = ?`,
      [printer_name],
      (printerError, printerResults) => {
        if (printerError) {
          console.log(printerError);
          return res.status(500).json({
            success: 0,
            message: "Database error fetching printer"
          });
        }

        if (!printerResults || printerResults.length === 0) {
          return res.status(404).json({
            success: 0,
            message: "Printer not found"
          });
        }

        const printerConfig = printerResults[0];
        const printer_ip = printerConfig.cfg_ipaddress;
        const printer_port = printerConfig.cfg_port;

        // Query based on supervisor status
        const query = is_supervisor
          ? `SELECT wci.* FROM wo_cabinet_info wci 
             INNER JOIN wo_cabinet wc ON wci.wo_cabinetlabel = wc.wo_cabinetlabel 
             WHERE wci.WO_ID = ? ORDER BY wci.wo_cabinetlabel ASC`
          : `SELECT wci.* FROM wo_cabinet_info wci 
             INNER JOIN wo_cabinet wc ON wci.wo_cabinetlabel = wc.wo_cabinetlabel 
             WHERE wci.WO_ID = ? AND (wc.wo_cabinetlabel_printdate IS NULL OR wc.wo_cabinetlabel_printdate = '' OR wc.wo_cabinetlabel_printdate = 0) 
             ORDER BY wci.wo_cabinetlabel ASC`;

        // Now get the cabinet labels
        connection.query(
          query,
          [wo],
          (error, results, fields) => {
            if (error) {
              console.log(error);
              return res.status(500).json({
                success: 0,
                message: "Database error fetching cabinet labels"
              });
            }

            if (results.length === 0) {
              return res.status(400).json({
                success: 0,
                message: is_supervisor ? "No cabinet labels found" : "All cabinet labels have already been printed. Supervisor access required to reprint.",
                already_printed: !is_supervisor
              });
            }

            // Apply quantity limit
            const quantity = parseInt(req.body.quantity) || results.length;
            const limitedResults = results.slice(0, quantity);

            var cabinet_label = printer.makeCabinetLabel(limitedResults);
            printer.createPrint(printer_ip, printer_port, cabinet_label);

            // Update printdate for all printed cabinet labels
            const currentTime = Date.now();
            const cabinetLabels = limitedResults.map(r => r.wo_cabinetlabel);

            if (cabinetLabels.length > 0) {
              connection.query(
                `UPDATE wo_cabinet SET wo_cabinetlabel_printdate = ? WHERE wo_cabinetlabel IN (?)`,
                [currentTime, cabinetLabels],
                (updateError) => {
                  if (updateError) {
                    console.error('Error updating cabinet printdate:', updateError);
                  }
                }
              );
            }

            res.status(200).json({
              success: 1,
              data: limitedResults,
              printed: limitedResults.length,
              total: results.length,
              message: "Print job sent successfully"
            });
          }
        );
      }
    );
  },

  printPalletLabel: (req, res, next) => {
    let wo = req.params["wo"];
    const printer_name = req.body.printer_name;
    const is_supervisor = req.body.is_supervisor || false;

    if (!printer_name) {
      return res.status(400).json({
        success: 0,
        message: "Printer name is required"
      });
    }

    // First, get printer details
    connection.query(
      `SELECT cfg_id, cfg_name, cfg_ipaddress, cfg_port FROM cfg WHERE cfg_type = 'printer' AND cfg_name = ?`,
      [printer_name],
      (printerError, printerResults) => {
        if (printerError) {
          console.log(printerError);
          return res.status(500).json({
            success: 0,
            message: "Database error fetching printer"
          });
        }

        if (!printerResults || printerResults.length === 0) {
          return res.status(404).json({
            success: 0,
            message: "Printer not found"
          });
        }

        const printerConfig = printerResults[0];
        const printer_ip = printerConfig.cfg_ipaddress;
        const printer_port = printerConfig.cfg_port;

        // Get work order info with kit details from master_kit
        connection.query(
          `SELECT wo.wo_id, wo.kit_code, mk.kit_desc, wo.work_order 
           FROM wo 
           INNER JOIN master_kit mk ON wo.kit_code = mk.kit_code 
           WHERE wo.wo_id = ?`,
          [wo],
          (woError, woResults) => {
            if (woError) {
              console.log(woError);
              return res.status(500).json({
                success: 0,
                message: "Database error fetching work order info"
              });
            }

            if (!woResults || woResults.length === 0) {
              return res.status(404).json({
                success: 0,
                message: "Work order not found"
              });
            }

            const kitInfo = woResults[0];

            // Query based on supervisor status
            const query = is_supervisor
              ? `SELECT * FROM wo_pallet WHERE wo_id = ? ORDER BY wo_palletlabel ASC`
              : `SELECT * FROM wo_pallet WHERE wo_id = ? AND (wo_palletlabel_printdate IS NULL OR wo_palletlabel_printdate = '') ORDER BY wo_palletlabel ASC`;

            // Get the pallet labels
            connection.query(
              query,
              [wo],
              (error, results, fields) => {
                if (error) {
                  console.log(error);
                  return res.status(500).json({
                    success: 0,
                    message: "Database error fetching pallet labels"
                  });
                }

                if (results.length === 0) {
                  return res.status(400).json({
                    success: 0,
                    message: is_supervisor ? "No pallet labels found" : "All pallet labels have already been printed. Supervisor access required to reprint.",
                    already_printed: !is_supervisor
                  });
                }

                // Add kit info to each pallet label
                const enrichedResults = results.map(item => ({
                  ...item,
                  kit_code: kitInfo.kit_code,
                  kit_desc: kitInfo.kit_desc,
                  work_order: kitInfo.work_order
                }));

                var pallet_label = printer.makePalletLabel(enrichedResults);
                printer.createPrint(printer_ip, printer_port, pallet_label);

                // Update printdate for all printed labels
                const currentTime = Date.now();
                const palletIds = results.map(r => r.wo_pallet_id);

                if (palletIds.length > 0) {
                  connection.query(
                    `UPDATE wo_pallet SET wo_palletlabel_printdate = ? WHERE wo_pallet_id IN (?)`,
                    [currentTime, palletIds],
                    (updateError) => {
                      if (updateError) {
                        console.error('Error updating printdate:', updateError);
                      }
                    }
                  );
                }

                res.status(200).json({
                  success: 1,
                  data: enrichedResults,
                  printed: enrichedResults.length,
                  message: "Print job sent successfully"
                });
              }
            );
          }
        );
      }
    );
  },

  printCabinetLabelByCabinetLabel: (req, res, next) => {
    const body = req.body;
    console.log("Print Cabinet Label Params | " + JSON.stringify(body));
    console.log(body);

    // Extract relevant data from the request body
    let cabinetLabel = body["cabinetLabel"].trim();
    let printerName = body["printerName"].trim();
    connection.query(
      `SELECT * FROM wo_cabinet WC WHERE WC.wo_cabinetlabel = ?`,
      [cabinetLabel],
      (error, cabinets, fields) => {
        //console.log("Returned Barcodes = " + JSON.stringify(cabinets))
        if (error) {
          console.log(error);
          next(
            res.status(500).json({
              success: 0,
              message: "Database connection errror",
            })
          );
        }

        if (!cabinets || cabinets.length == 0) {
          console.log("Unable to find cabinet with label " + cabinetLabel);
          next(
            res.status(400).json({
              success: 0,
              message: "Invalid Cabinet Label",
              data: [],
            })
          );
          return;
        }

        connection.query(
          `select cfg_ipaddress, cfg_port from cfg where cfg_type = 'printer' and cfg_name = ?`,
          [printerName],
          (error, printers, fields) => {
            if (!printers || printers.length == 0) {
              next(
                res.status(400).json({
                  success: 0,
                  message: "Invalid Printer Name",
                  data: [],
                })
              );
              return;
            }
            var cabinetLabelContent = printer.makeCabinetLabel(cabinets);
            const printerIp = printers[0]["cfg_ipaddress"];
            const printerPort = printers[0]["cfg_port"];
            printer.createPrint(printerIp, printerPort, cabinetLabelContent);
            //printer.createPrint("10.10.100.93",6101,tray_label_content);
            console.log(cabinetLabelContent);
            console.log(
              "Cabinet Lable printed to printer " +
              printerIp +
              ":" +
              printerPort
            );

            // Update printdate for the printed cabinet label
            const currentTime = Date.now();
            connection.query(
              `UPDATE wo_cabinet SET wo_cabinetlabel_printdate = ? WHERE wo_cabinetlabel = ?`,
              [currentTime, cabinetLabel],
              (updateError) => {
                if (updateError) {
                  console.error('Error updating cabinet printdate:', updateError);
                }
              }
            );

            next(
              res.status(200).json({
                success: 1,
                message: "Successfully printed cabinet label " + cabinetLabel,
                data: cabinets,
              })
            );
          }
        );
      }
    );
  },

  printCartonLabelByCartonLabel: (req, res, next) => {
    function formatDate(dateString) {
      // Extract year, month, and day from the string
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);

      // Combine them in the desired format
      return `${year}-${month}-${day}`;
    }

    const body = req.body;
    console.log("Print Carton Label Params | " + JSON.stringify(body));
    console.log(body);
    // Extract relevant data from the request body
    let cartonLabel = body["cartonLabel"].trim();
    let printerName = body["printerName"].trim();

    let query = `SELECT
  distinct wc.wo_id as wo_id,
   wc.wo_cabinet_id as wo_cabinet_id,
   wc.wo_cartonlabel as wo_cartonlabel,
   wo.kit_code as wo_kit_code,
   wc.wo_cartonlabel_printdate as wo_cartonlabel_printdate,
   DATE_FORMAT(FROM_UNIXTIME(wk.wo_kit_scandate / 1000), '%Y%m%d%h%i%s') as kit_scandate,
   mk.kit_desc as mk_kit_desc,
   mk.kit_upc as mk_kit_upc,
   min(ws.exp_date) as exp_date
   from
    wo_scan ws 	inner join wo_tray wt on ws.wo_tray_id = wt.wo_tray_id
    inner join wo_kit wk on wt.wo_tray_id = wk.wo_tray_id
    inner join wo_cabinet wc on wk.wo_cabinet_id = wc.wo_cabinet_id
    inner join wo wo on wo.wo_id = wc.wo_id
    right join master_kit mk on wo.kit_code = mk.kit_code
   where wc.wo_cartonlabel = ? and ws.exp_date is not null and wk.wo_kit_scandate is not null 
   group by wk.wo_cabinet_id`;

    connection.query(query, [cartonLabel], (error, results) => {
      if (error) {
        console.log(error);
        return next(
          res.status(500).json({
            success: 0,
            message: "Database connection error",
          })
        );
      }

      if (!(results && results[0] && results[0]["wo_kit_code"])) {
        console.log("Unable to find any carton with label");
        res.status(400).json({
          success: 0,
          data: results,
          message: "Invalid Carton Label",
        });
        return;
      }

      connection.query(
        `select cfg_ipaddress, cfg_port from cfg where cfg_type = 'printer' and cfg_name = ?`,
        [printerName],
        (error, printers, fields) => {
          if (!printers || printers.length == 0) {
            next(
              res.status(400).json({
                success: 0,
                message: "Invalid Printer Name",
                data: [],
              })
            );
            return;
          }

          const printerIp = printers[0]["cfg_ipaddress"];
          const printerPort = printers[0]["cfg_port"];
          console.log("Reprint Label Results: " + JSON.stringify(results));
          //rebuild expected JSON
          const cartonObj = {
            kit_code: results[0]["wo_kit_code"],
            item_desc: results[0]["mk_kit_desc"],
            cabinet_label: results[0]["wo_cartonlabel"],
            expiry_date: formatDate(results[0]["exp_date"]),
            build_date: formatDate(results[0]["kit_scandate"]),
            kit_upc: results[0]["mk_kit_upc"],
          };

          var cartonLabelCode = printer.genCartonCode(cartonObj);
          try {
            printer.createPrint(printerIp, printerPort, cartonLabelCode);
            //print_status = printer.createPrint("10.10.100.93",6101,cartonLabel);
            console.log(
              "Carton Lable printed to printer " + printerIp + ":" + printerPort
            );
          } catch (error) {
            res.status(500).json({
              success: 0,
              data: results,
              message: "Unable to Connect to Printer. Check printer condition.",
            });
          }
          res.status(200).json({
            success: 1,
            data: results,
            message: "Successfully printed carton label",
          });
        }
      );
    });
  },

  printTrayLabelByTrayLabel: (req, res, next) => {
    const body = req.body;
    console.log("Print Tray Label Params | " + JSON.stringify(body));
    console.log(body);

    // Extract relevant data from the request body
    let trayLabel = body["trayLabel"].trim();
    let printerName = body["printerName"].trim();

    connection.query(
      `SELECT * FROM wo_tray WT WHERE WT.wo_traylabel = ?`,
      [trayLabel],
      (error, trayLabels, fields) => {
        //console.log("Returned Barcodes = " + JSON.stringify(results))
        if (error) {
          console.log(error);
          next(
            res.status(500).json({
              success: 0,
              message: "Database connection errror",
            })
          );
        }

        if (!trayLabels || trayLabels.length == 0) {
          console.log("Unable to find tray with label " + trayLabel);
          next(
            res.status(400).json({
              success: 0,
              message: "Invalid Tray Label",
              data: [],
            })
          );
          return;
        }

        connection.query(
          `select cfg_ipaddress, cfg_port from cfg where cfg_type = 'printer' and cfg_name = ?`,
          [printerName],
          (error, printers, fields) => {
            if (!printers || printers.length == 0) {
              next(
                res.status(400).json({
                  success: 0,
                  message: "Invalid Printer Name",
                  data: [],
                })
              );
              return;
            }
            var tray_label_content = printer.makeTrayLabel(trayLabels);
            const printerIp = printers[0]["cfg_ipaddress"];
            const printerPort = printers[0]["cfg_port"];
            printer.createPrint(printerIp, printerPort, tray_label_content);
            //printer.createPrint("10.10.100.93",6101,tray_label_content);
            console.log(tray_label_content);
            console.log(
              "Tray Lable printed to printer " + printerIp + ":" + printerPort
            );
            next(
              res.status(200).json({
                success: 1,
                message: "Successfully printed tray label " + trayLabel,
                data: trayLabels,
              })
            );
          }
        );
      }
    );
  },

  fetchWorkOrderCabinets: (req, res, next) => {
    console.log("fetchWorkOrderCabinets");
    connection.query(
      `SELECT * FROM wo_cabinet`,
      [],
      (error, results, fields) => {
        if (error) {
          console.log(error);
          next(
            res.status(500).json({
              success: 0,
              message: "Database connection errror",
            })
          );
        }

        if (!results || results.length == 0) {
          console.log("Unable to find cabinet with label " + cabinet_label);
          next(
            res.status(200).json({
              success: 1,
              data: [],
            })
          );
          return;
        }

        next(
          res.status(200).json({
            success: 1,
            data: results,
          })
        );
      }
    );
  },

  fetchWorkOrderTrays: (req, res, next) => {
    console.log("fetchWorkOrderTrays");
    connection.query(`SELECT * FROM wo_tray`, [], (error, results, fields) => {
      if (error) {
        console.log(error);
        next(
          res.status(500).json({
            success: 0,
            message: "Database connection errror",
          })
        );
      }

      if (!results || results.length == 0) {
        console.log("Unable to find trays" + tray_label);
        next(
          res.status(200).json({
            success: 1,
            data: [],
          })
        );
        return;
      }

      next(
        res.status(200).json({
          success: 1,
          data: results,
        })
      );
    });
  },

  getTrayIdData1: (req, res, next) => {
    console.log("Get Tray ID Data Params: " + JSON.stringify(req.params));
    let trayidlabel = req.params["trayidlabel"];

    // First query to get tray information
    var query1 = `SELECT wo.kit_code, wo.wo_qty, wo.add_date, wo.start_date, wo.complete_date, wo.wo_id, wo.work_order, wo.prod_order,
    wo_tray.wo_traylabel, wo_tray.wo_traylabel_printdate, wo_tray.wo_tray_id
    FROM wo INNER JOIN wo_tray ON wo.wo_id = wo_tray.wo_id
    WHERE wo_tray.wo_traylabel = ?`;

    connection.query(query1, [trayidlabel], (error, results1, fields) => {
      if (error) {
        console.log(error);
        return next(
          res.status(500).json({
            success: 0,
            message: "Database connection error",
          })
        );
      }

      if (results1.length === 0) {
        return next(
          res.status(404).json({
            success: 0,
            message: "Tray not found",
          })
        );
      }

      const trayInfo = results1[0];
      const wo_tray_id = trayInfo.wo_tray_id;
      const kit_code = trayInfo.kit_code;

      // Second query to get scan information
      var query2 = `SELECT ws.*, p.lens_desc
      FROM wo_scan ws
      JOIN planogram p ON ws.scan_upc = p.lens_upc AND p.kit_code = ?
      WHERE ws.wo_tray_id = ? AND p.ws_id = ?
      GROUP BY ws.wo_scan_id`;

      connection.query(
        query2,
        [kit_code, wo_tray_id, req.params["ws_id"]],
        (error, results2, fields) => {
          if (error) {
            console.log(error);
            return next(
              res.status(500).json({
                success: 0,
                message: "Database connection error",
              })
            );
          }

          // Third query to get max tray quantity
          var query3 = `SELECT count(*) as max_tray_qty 
        FROM planogram 
        WHERE kit_code = ? AND ws_number = ? AND tray_number = ? AND length(lens_upc) > 0;`;

          const ws_number = req.params["ws_id"];
          const tray_number = trayInfo.wo_traylabel.match(/T(\d+)/)[1]; // Extract tray number from wo_traylabel

          connection.query(
            query3,
            [trayInfo.kit_code, ws_number, tray_number],
            (error, results3, fields) => {
              if (error) {
                console.log(error);
                return next(
                  res.status(500).json({
                    success: 0,
                    message: "Database connection error",
                  })
                );
              }

              const maxTrayQty = results3[0].max_tray_qty;

              // Check if tray is fully populated
              const isFullyPopulated = results2.length >= maxTrayQty;
              const message = isFullyPopulated
                ? "Tray is complete for this station ✔️"
                : "Tray is not fully populated"; //INFO: OUR FIRST EMOJI

              next(
                res.status(200).json({
                  success: 1,
                  data: {
                    trayInfo: trayInfo,
                    scanInfo: results2,
                    maxTrayQty: maxTrayQty,
                    currentScanCount: results2.length,
                    isFullyPopulated: isFullyPopulated,
                    message: message,
                  },
                })
              );
            }
          );
        }
      );
    });
  },

  pushKit(req, res, next) {
    //INSERT INTO WO_KIT VALUES (0,<cabinetid>,<wo_tray_id),TIME())
    let kitobj = req.body;
    //console.log((JSON.stringify(kitobj)));

    let currentTime = Date.now();
    console.log("Push Kit | Kit obj: " + JSON.stringify(kitobj));
    let cabinetid = kitobj["cabinetId"];
    let cabinetLabel = kitobj["cabinetlabel"];
    let trays = kitobj["trays"];
    const flattenedTrays = trays.flatMap((tray) => Object.values(tray));

    var query = "INSERT INTO wo_kit VALUES(0,?,?,?)";

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    flattenedTrays.forEach((tray, index) => {
      connection.query(
        query,
        [cabinetid, tray.wo_tray_id, currentTime],
        (error, result, fields) => {
          if (error) {
            console.error("Error inserting tray:", error);
            errorCount++;
          } else {
            console.log("Inserted tray:", result);
            successCount++;
            results.push(result);
          }

          // Check if this is the last query
          if (index === flattenedTrays.length - 1) {
            sendResponse();
          }
        }
      );
    });

    function sendResponse() {
      if (errorCount > 0) {
        res.status(500).json({
          success: 0,
          message: `Database error occurred for ${errorCount} trays`,
          successfulInserts: successCount,
          data: results,
        });
      } else {
        console.log("Send response entry");
        console.log("Update Carton");
        updateCarton();
        console.log("Now we'd print");
        res.status(200).json({
          success: 1,
          message: `Successfully inserted ${successCount} trays`,
          data: results,
        });
      }
    }

    function updateCarton() {
      let query = `UPDATE wo_cabinet SET wo_cartonlabel = ?, wo_cartonlabel_printdate = ?  WHERE wo_cabinet_id = ?`;

      connection.query(
        query,
        [cabinetLabel, currentTime, cabinetid],
        (error, results, fields) => {
          console.log("Update Carton: " + JSON.stringify(results));
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
          let success = 0;
          if (results !== null) {
            success = 1;
            body = results;
          } else {
            body.push(null);
          }
        }
      );
    }
  },

  checkCabinet(req, res, next) {
    let workorderID = req.params["wo_id"];
    let cabinetlabel = req.params["cabinetlabel"];

    var query =
      "SELECT * FROM wo_cabinet where wo_id = ? AND wo_cabinetlabel = ?";

    connection.query(
      query,
      [workorderID, cabinetlabel],
      (error, results, fields) => {
        console.log("Check Cabinet Results " + JSON.stringify(results));
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
        let success = 0;
        let message = "";

        if (results !== null && results.length > 0) {
          body = results;
          success = 1;
          message = "Cabinet Label is available";
        } else {
          success = 0;
          message = "Work Order Cabinet doesn't exists";
          body.push(null);
        }
        next(
          res.status(200).json({
            success: success,
            message: message,
            data: body,
          })
        );
      }
    );
  },

  checkCabinetAlreadyScanned(req, res, next) {
    let cabinetlabel = req.params["cabinetlabel"];

    var query =
      "SELECT count(*) AS `exists` FROM wo_kit wk INNER JOIN wo_cabinet wc ON wk.wo_cabinet_id=wc.wo_cabinet_id WHERE wc.wo_cabinetlabel = ?";
    connection.query(query, [cabinetlabel], (error, results, fields) => {
      console.log(
        "checkCabinetAlreadyScanned Results " + JSON.stringify(results)
      );
      if (error) {
        console.log(error);
        next(
          res.status(500).json({
            success: 0,
            message: "Database connection errror",
          })
        );
      }
      let success = 0;
      let message = "";
      if (results !== null && results.length > 0 && results[0].exists > 0) {
        success = 0;
        message = "Work Order Cabinet is already scanned";
      } else {
        success = 1;
        message = "Cabinet Label is not scanned yet";
      }
      next(
        res.status(200).json({
          success: success,
          message: message,
        })
      );
    });
  },

  fetchMasterTraysByKitCode(req, res, next) {
    let master_kit_code = req.params["master_kit_code"];
    console.log("fetchMasterTraysByKitCode " + master_kit_code);
    let query = `SELECT mt.tray_id, mt.tray_kit_code FROM master_tray mt JOIN master_kit mk ON mk.kit_id = mt.kit_id WHERE mk.kit_code = ?`;

    connection.query(query, [master_kit_code], (error, results, fields) => {
      console.log(
        "fetchMasterTraysByKitCode Results " + JSON.stringify(results)
      );
      if (error) {
        console.log(error);
        next(
          res.status(500).json({
            success: 0,
            message: "Database connection errror",
          })
        );
      }

      //console.log(results);
      let success = 0;
      if (results !== null) {
        success = 1;
        body = results;
      } else {
        body.push(null);
      }

      next(
        res.status(200).json({
          success: success,
          data: results,
        })
      );
    });
  },

  updateConfigLineStations(req, res, next) {
    const configLineIds = req.body.configLineIds;
    const sourceStation = req.body.sourceStation;
    const targetStation = req.body.targetStation;

    console.log(
      `updateConfigLineStations ${configLineIds} - ${sourceStation} - ${targetStation}`
    );

    let query = `update cfg_line cl
                  set ws_id = ?
                  where ws_id = ? and cl.cfg_line_id in (?)`;
    connection.query(
      query,
      [parseInt(targetStation), parseInt(sourceStation), configLineIds],
      (error, results, fields) => {
        console.log(
          "updateConfigLineStations Results " + JSON.stringify(results)
        );
        if (error) {
          console.log(error);
          next(
            res.status(500).json({
              success: 0,
              message: "Database connection errror",
            })
          );
        }

        next(
          res.status(200).json({
            success: 1,
            data: [],
          })
        );
      }
    );
  },

  fetchMasterKits(req, res, next) {
    console.log("fetchMasterKits ");
    let query = `select * from master_kit`;

    connection.query(query, [], (error, results, fields) => {
      console.log("fetchMasterKits Results " + JSON.stringify(results));
      if (error) {
        console.log(error);
        next(
          res.status(500).json({
            success: 0,
            message: "Database connection errror",
          })
        );
      }

      //console.log(results);
      let success = 0;
      if (results !== null) {
        success = 1;
        body = results;
      } else {
        body.push(null);
      }

      next(
        res.status(200).json({
          success: success,
          data: results,
        })
      );
    });
  },

  getCompletedCabinet(req, res, next) {
    let cabinetLabel = req.params["cabinetlabel"];
    let wo_id = req.params["wo_id"];
    console.log("getCompletedCabinet param: " + cabinetLabel);
    let query = `select
   distinct wc.wo_id as wo_id,
    wc.wo_cabinet_id as wo_cabinet_id,
    wc.wo_cartonlabel as wo_cartonlabel,
    DATE_FORMAT(FROM_UNIXTIME(wk.wo_kit_scandate / 1000), '%Y%m%d%h%i%s') as kit_scandate,
    min(ws.exp_date) as exp_date
from
     wo_scan ws 	inner join wo_tray wt on ws.wo_tray_id = wt.wo_tray_id
    				inner join wo_kit wk on wt.wo_tray_id = wk.wo_tray_id
    				inner join wo_cabinet wc on wk.wo_cabinet_id = wc.wo_cabinet_id
where wc.wo_cartonlabel = ? AND wc.wo_id = ? and ws.exp_date is not null and wk.wo_kit_scandate is not null`;

    connection.query(query, [cabinetLabel, wo_id], (error, results, fields) => {
      console.log("getTrayCount Results " + JSON.stringify(results));
      if (error) {
        console.log(error);
        next(
          res.status(500).json({
            success: 0,
            message: "Database connection errror",
          })
        );
      }

      //console.log(results);
      let success = 0;
      if (results !== null) {
        success = 1;
        body = results;
      } else {
        body.push(null);
      }

      next(
        res.status(200).json({
          success: success,
          data: results,
        })
      );
    });
  },

  getTrayCount(req, res, next) {
    //SELECT distinct(tray_number) FROM ikb.planogram where kit_id = ?;
    console.log("getTrayCount EntryPoint" + JSON.stringify(req.params));
    let kitcode = req.params["kit_code"];

    var query =
      "SELECT kit_desc,kit_upc,tray_count from master_kit where kit_code = ?";

    connection.query(query, [kitcode], (error, results, fields) => {
      console.log("getTrayCount Results " + JSON.stringify(results));
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
      let success = 0;
      if (results !== null) {
        success = 1;
        body = results;
      } else {
        body.push(null);
      }

      next(
        res.status(200).json({
          success: success,
          data: results,
        })
      );
    });
  },

  getStationCount(req, res, next) {
    console.log("getStationCount Params: " + JSON.stringify(req.params));
    var query =
      "SELECT distinct(ws_id) from planogram where kit_code = '" +
      req.params["kitid"] +
      "'"; //TODO: Change this to kit_id once we get a chance
    console.log("Station Count Query : " + query);

    connection.query(query, [], (error, results, fields) => {
      console.log("getStationCount results = " + JSON.stringify(results));
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
      let success = 0;
      if (results !== null) {
        success = 1;
        body = results;
      } else {
        body.push(null);
      }

      next(
        res.status(200).json({
          success: success,
          data: body,
        })
      );
    });

    //SELECT distinct(ws_id) from planogram where kit_id = 3;
  },

  checkTrayLabel: (req, res, next) => {
    console.log("CheckTrayLabel EntryPoint" + JSON.stringify(req.params));
    let workorderID = req.params["wo_id"];
    let trayLabel = req.params["traylabel"];

    var query = `select wt.wo_id,
            wt.wo_tray_id,
            wt.wo_traylabel,
            wt.wo_traylabel_printdate,
            wt.tray_id,
            max(wk.wo_kit_id) as wo_kit_id,
            max(ws.wo_scan_id) as wo_scan_id
        from wo_tray wt
            left join wo_kit wk on wt.wo_tray_id = wk.wo_tray_id
            left join wo_scan ws on wt.wo_tray_id = ws.wo_tray_id
        where wt.wo_id = ?  and wt.wo_traylabel = ?
        group by wt.wo_id, wt.wo_traylabel`;

    connection.query(
      query,
      [workorderID, trayLabel],
      (error, results, fields) => {
        console.log("checkTrayLabel Results " + JSON.stringify(results));
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
        let success = 1;
        let statusCode = 200;
        let data = results;
        let message = "Successfully fetched Tray records";
        if (results === null || results.length === 0) {
          next(
            res.status(400).json({
              success: 0,
              message: `Tray details with label ${trayLabel} doesn't exists`,
              data: null,
            })
          );
          return;
        } else if (results[0].wo_scan_id === null) {
          next(
            res.status(400).json({
              success: 0,
              message: `Tray details with label ${trayLabel} doesn't have any scan`,
              data: null,
            })
          );
          return;
        } else if (results[0].wo_kit_id != null) {
          next(
            res.status(400).json({
              success: 0,
              message: `Tray label ${trayLabel} is already submitted`,
              data: null,
            })
          );
          return;
        }

        var diff_query = `SELECT 
                          (select count(*) from wo_scan where wo_tray_id = ?) -
                            (select tray_lens_count from mastertray_lens_count mlc where mlc.tray_id = ?) as diff`;

        connection.query(
          diff_query,
          [data[0].wo_tray_id, data[0].tray_id],
          (error, diff_query_results, fields) => {
            console.log(
              "diff_query Results " + JSON.stringify(diff_query_results)
            );
            if (error) {
              console.log(error);
              next(
                res.status(500).json({
                  success: 0,
                  message: "Database connection errror",
                })
              );
            }

            if (
              diff_query_results === null ||
              diff_query_results.length === 0
            ) {
              console.log("diff-query results are null");
              statusCode = 400;
              data = null;
              success = 0;
              message = `Tray label ${trayLabel} is not fully scanned`;
            } else if (diff_query_results[0].diff === null) {
              console.log("diff field is not available in diff-query results");
              statusCode = 400;
              data = null;
              success = 0;
              message = `Tray label ${trayLabel} is not fully scanned`;
            } else if (diff_query_results[0].diff < 0) {
              statusCode = 400;
              data = null;
              success = 0;
              message = `Tray label ${trayLabel} is not fully scanned`;
            }

            next(
              res.status(statusCode).json({
                success: success,
                message: message,
                data: data,
              })
            );

            console.log(
              "Provided Tray label is not fully scanned " + trayLabel
            );
          }
        );
      }
    );
  },

  checkTrayIdAlreadySubmitted: (req, res, next) => {
    console.log(
      "checkTrayIdAlreadySubmitted EntryPoint" + JSON.stringify(req.params)
    );

    let trayLabel = req.params["traylabel"];

    var query =
      "select count(*) as exist from wso_kit wk inner join wo_tray wt on wk.wo_tray_id = wt.wo_tray_id  where wt.wo_traylabel = ?";

    connection.query(query, [trayLabel], (error, results, fields) => {
      console.log(
        "checkTrayIdAlreadySubmitted Results " + JSON.stringify(results)
      );
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
      if (results !== null && results.length > 0 && results[0].exists == 0) {
        return true;
      }

      next(
        res.status(400).json({
          success: 0,
          message: `Tray label ${trayLabel} is already submitted`,
          data: null,
        })
      );
    });
  },

  checkTrayHasScans: (req, res, next) => {
    console.log("checkTrayHasScans EntryPoint" + JSON.stringify(req.params));

    let trayLabel = req.params["traylabel"];

    var query =
      "select count(*) as exists from wo_scan ws inner join wo_tray wt on ws.wo_tray_id = wt.wo_tray_id where wt.wo_traylabel = ?";

    connection.query(query, [trayLabel], (error, results, fields) => {
      console.log("checkTrayHasScans Results " + JSON.stringify(results));
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
      if (results !== null && results.length > 0 && results[0].exists > 0) {
        return true;
      }

      next(
        res.status(400).json({
          success: 0,
          message: `Tray label ${trayLabel} doesnt have any lens scanned`,
          data: null,
        })
      );
    });
  },

  passwordCheck: (req, res, next) => {
    console.log("passwordCheck");

    let pswd = req.params["pswd"];
    let config_name = req.params["config_name"];
    connection.query(
      `select count(*) as count from cfg where cfg_type = 'pswd' and cfg_name = 'scanstation' and cfg_password = ?`,
      [pswd],
      (error, results, fields) => {
        console.log("Returned Configuration = " + JSON.stringify(results));
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
        next(
          res.status(200).json({
            success: results && results.length === 1 && results[0].count === 1,
          })
        );
      }
    );
  },

  passwordCheckPrintStation: (req, res, next) => {
    console.log("passwordCheckPrintStation");

    let pswd = req.params["pswd"];
    connection.query(
      `select count(*) as count from cfg where cfg_type = 'pswd' and cfg_name = 'printstation' and cfg_password = ?`,
      [pswd],
      (error, results, fields) => {
        console.log("Returned Configuration = " + JSON.stringify(results));
        if (error) {
          console.log(error);
          next(
            res.status(500).json({
              success: 0,
              message: "Database connection error",
            })
          );
        }
        console.log(results);
        next(
          res.status(200).json({
            success: results && results.length === 1 && results[0].count === 1,
          })
        );
      }
    );
  },

  getPrinters: (req, res, next) => {
    console.log("Printer Enum");
    console.log(req.params);
    connection.query(
      `select * from cfg where cfg_type = 'printer'`,
      [],
      (error, results, fields) => {
        console.log("Returned Printers = " + JSON.stringify(results));
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

        next(
          res.status(200).json({
            success: 1,
            data: results,
          })
        );
      }
    );
  },

  getPrinterByName: (req, res, next) => {
    console.log("Printer by name");
    console.log(req.params);
    let printer_name = req.params["printer_name"];

    connection.query(
      `select cfg_id, cfg_ipaddress, cfg_port, cfg_name, cfg_type from cfg where cfg_type = 'printer' and cfg_name = ?`,
      [printer_name],
      (error, results, fields) => {
        console.log("Returned Printer = " + JSON.stringify(results));
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

        if (results.length > 0) {
          next(
            res.status(200).json({
              success: 1,
              data: results[0],
            })
          );
        } else {
          next(
            res.status(400).json({
              success: 0,
              message: "Printer with name doesnt exist",
            })
          );
        }
      }
    );
  },

  getTrayLabelsForSelection: (req, res, next) => {
    console.log("getTrayLabelsForSelection");
    let wo = req.params["wo"];

    connection.query(
      `SELECT wo_tray_id, wo_traylabel, wo_traylabel_printdate, tray_id 
       FROM wo_tray 
       WHERE wo_id = ? 
       ORDER BY wo_traylabel ASC`,
      [wo],
      (error, results, fields) => {
        if (error) {
          console.log(error);
          return res.status(500).json({
            success: 0,
            message: "Database connection error"
          });
        }

        res.status(200).json({
          success: 1,
          data: results
        });
      }
    );
  },

  getPalletLabelsForSelection: (req, res, next) => {
    console.log("getPalletLabelsForSelection");
    let wo = req.params["wo"];

    connection.query(
      `SELECT wo_pallet_id, wo_palletlabel, wo_palletlabel_printdate 
       FROM wo_pallet 
       WHERE wo_id = ? 
       ORDER BY wo_palletlabel ASC`,
      [wo],
      (error, results, fields) => {
        if (error) {
          console.log(error);
          return res.status(500).json({
            success: 0,
            message: "Database connection error"
          });
        }

        res.status(200).json({
          success: 1,
          data: results
        });
      }
    );
  },

  getCabinetLabelsForSelection: (req, res, next) => {
    console.log("getCabinetLabelsForSelection");
    let wo = req.params["wo"];

    connection.query(
      `SELECT wci.*, wc.wo_cabinetlabel_printdate 
       FROM wo_cabinet_info wci
       LEFT JOIN wo_cabinet wc ON wci.wo_cabinetlabel = wc.wo_cabinetlabel
       WHERE wci.WO_ID = ? 
       ORDER BY wci.wo_cabinetlabel ASC`,
      [wo],
      (error, results, fields) => {
        if (error) {
          console.log(error);
          return res.status(500).json({
            success: 0,
            message: "Database connection error"
          });
        }

        res.status(200).json({
          success: 1,
          data: results
        });
      }
    );
  },

  printSelectedTrayLabels: (req, res, next) => {
    console.log("printSelectedTrayLabels");
    const printer_name = req.body.printer_name;
    const tray_ids = req.body.tray_ids; // array of wo_tray_id

    if (!printer_name || !tray_ids || tray_ids.length === 0) {
      return res.status(400).json({
        success: 0,
        message: "Printer name and tray IDs are required"
      });
    }

    // Get printer details
    connection.query(
      `SELECT cfg_id, cfg_name, cfg_ipaddress, cfg_port FROM cfg WHERE cfg_type = 'printer' AND cfg_name = ?`,
      [printer_name],
      (printerError, printerResults) => {
        if (printerError || !printerResults || printerResults.length === 0) {
          return res.status(404).json({
            success: 0,
            message: "Printer not found"
          });
        }

        const printerConfig = printerResults[0];
        const printer_ip = printerConfig.cfg_ipaddress;
        const printer_port = printerConfig.cfg_port;

        // Get selected tray labels
        connection.query(
          `SELECT * FROM wo_tray WHERE wo_tray_id IN (?) ORDER BY wo_traylabel ASC`,
          [tray_ids],
          (error, results) => {
            if (error) {
              console.log(error);
              return res.status(500).json({
                success: 0,
                message: "Database error fetching tray labels"
              });
            }

            if (results.length === 0) {
              return res.status(400).json({
                success: 0,
                message: "No tray labels found for selected IDs"
              });
            }

            // Print labels
            var tray_label = printer.makeTrayLabel(results);
            printer.createPrint(printer_ip, printer_port, tray_label);

            // Update printdate
            const currentTime = Date.now();
            connection.query(
              `UPDATE wo_tray SET wo_traylabel_printdate = ? WHERE wo_tray_id IN (?)`,
              [currentTime, tray_ids],
              (updateError) => {
                if (updateError) {
                  console.error('Error updating printdate:', updateError);
                }
              }
            );

            res.status(200).json({
              success: 1,
              data: results,
              printed: results.length,
              message: "Selected tray labels sent to printer successfully"
            });
          }
        );
      }
    );
  },

  printSelectedPalletLabels: (req, res, next) => {
    console.log("printSelectedPalletLabels");
    const printer_name = req.body.printer_name;
    const pallet_ids = req.body.pallet_ids; // array of wo_pallet_id
    const wo_id = req.body.wo_id;

    if (!printer_name || !pallet_ids || pallet_ids.length === 0 || !wo_id) {
      return res.status(400).json({
        success: 0,
        message: "Printer name, pallet IDs, and work order ID are required"
      });
    }

    // Get printer details
    connection.query(
      `SELECT cfg_id, cfg_name, cfg_ipaddress, cfg_port FROM cfg WHERE cfg_type = 'printer' AND cfg_name = ?`,
      [printer_name],
      (printerError, printerResults) => {
        if (printerError || !printerResults || printerResults.length === 0) {
          return res.status(404).json({
            success: 0,
            message: "Printer not found"
          });
        }

        const printerConfig = printerResults[0];
        const printer_ip = printerConfig.cfg_ipaddress;
        const printer_port = printerConfig.cfg_port;

        // Get work order info with kit details
        connection.query(
          `SELECT wo.wo_id, wo.kit_code, mk.kit_desc, wo.work_order 
           FROM wo 
           INNER JOIN master_kit mk ON wo.kit_code = mk.kit_code 
           WHERE wo.wo_id = ?`,
          [wo_id],
          (woError, woResults) => {
            if (woError || !woResults || woResults.length === 0) {
              return res.status(404).json({
                success: 0,
                message: "Work order not found"
              });
            }

            const kitInfo = woResults[0];

            // Get selected pallet labels
            connection.query(
              `SELECT * FROM wo_pallet WHERE wo_pallet_id IN (?) ORDER BY wo_palletlabel ASC`,
              [pallet_ids],
              (error, results) => {
                if (error) {
                  console.log(error);
                  return res.status(500).json({
                    success: 0,
                    message: "Database error fetching pallet labels"
                  });
                }

                if (results.length === 0) {
                  return res.status(400).json({
                    success: 0,
                    message: "No pallet labels found for selected IDs"
                  });
                }

                // Add kit info to each pallet label
                const enrichedResults = results.map(item => ({
                  ...item,
                  kit_code: kitInfo.kit_code,
                  kit_desc: kitInfo.kit_desc,
                  work_order: kitInfo.work_order
                }));

                // Print labels
                var pallet_label = printer.makePalletLabel(enrichedResults);
                printer.createPrint(printer_ip, printer_port, pallet_label);

                // Update printdate
                const currentTime = Date.now();
                connection.query(
                  `UPDATE wo_pallet SET wo_palletlabel_printdate = ? WHERE wo_pallet_id IN (?)`,
                  [currentTime, pallet_ids],
                  (updateError) => {
                    if (updateError) {
                      console.error('Error updating printdate:', updateError);
                    }
                  }
                );

                res.status(200).json({
                  success: 1,
                  data: enrichedResults,
                  printed: enrichedResults.length,
                  message: "Selected pallet labels sent to printer successfully"
                });
              }
            );
          }
        );
      }
    );
  },

  printSelectedCabinetLabels: (req, res, next) => {
    console.log("printSelectedCabinetLabels");
    const printer_name = req.body.printer_name;
    const cabinet_labels = req.body.cabinet_labels; // array of wo_cabinetlabel strings
    const is_supervisor = req.body.is_supervisor || false;

    if (!printer_name || !cabinet_labels || cabinet_labels.length === 0) {
      return res.status(400).json({
        success: 0,
        message: "Printer name and cabinet labels are required"
      });
    }

    // Get printer details
    connection.query(
      `SELECT cfg_id, cfg_name, cfg_ipaddress, cfg_port FROM cfg WHERE cfg_type = 'printer' AND cfg_name = ?`,
      [printer_name],
      (printerError, printerResults) => {
        if (printerError || !printerResults || printerResults.length === 0) {
          return res.status(404).json({
            success: 0,
            message: "Printer not found"
          });
        }

        const printerConfig = printerResults[0];
        const printer_ip = printerConfig.cfg_ipaddress;
        const printer_port = printerConfig.cfg_port;

        // Query based on supervisor status
        const query = is_supervisor
          ? `SELECT wci.* FROM wo_cabinet_info wci 
             INNER JOIN wo_cabinet wc ON wci.wo_cabinetlabel = wc.wo_cabinetlabel 
             WHERE wci.wo_cabinetlabel IN (?) ORDER BY wci.wo_cabinetlabel ASC`
          : `SELECT wci.* FROM wo_cabinet_info wci 
             INNER JOIN wo_cabinet wc ON wci.wo_cabinetlabel = wc.wo_cabinetlabel 
             WHERE wci.wo_cabinetlabel IN (?) AND (wc.wo_cabinetlabel_printdate IS NULL OR wc.wo_cabinetlabel_printdate = '' OR wc.wo_cabinetlabel_printdate = 0) 
             ORDER BY wci.wo_cabinetlabel ASC`;

        // Get selected cabinet labels from wo_cabinet_info view
        connection.query(
          query,
          [cabinet_labels],
          (error, results) => {
            if (error) {
              console.log(error);
              return res.status(500).json({
                success: 0,
                message: "Database error fetching cabinet labels"
              });
            }

            if (results.length === 0) {
              return res.status(400).json({
                success: 0,
                message: is_supervisor ? "No cabinet labels found for selected labels" : "All selected cabinet labels have already been printed. Supervisor access required to reprint.",
                already_printed: !is_supervisor
              });
            }

            // Print labels
            var cabinet_label = printer.makeCabinetLabel(results);
            printer.createPrint(printer_ip, printer_port, cabinet_label);

            // Update printdate for all printed cabinet labels
            const currentTime = Date.now();
            const printedLabels = results.map(r => r.wo_cabinetlabel);
            if (printedLabels.length > 0) {
              connection.query(
                `UPDATE wo_cabinet SET wo_cabinetlabel_printdate = ? WHERE wo_cabinetlabel IN (?)`,
                [currentTime, printedLabels],
                (updateError) => {
                  if (updateError) {
                    console.error('Error updating cabinet printdate:', updateError);
                  }
                }
              );
            }

            res.status(200).json({
              success: 1,
              data: results,
              printed: results.length,
              message: "Selected cabinet labels sent to printer successfully"
            });
          }
        );
      }
    );
  },

  getIncompleteWorkOrder: (req, res, next) => {
    const body = [];
    console.log("Incomplete Workorders");
    connection.query(
      `select work_order,prod_order,wo_id,kit_code from wo where complete_date = ''`,
      [],
      (error, results, fields) => {
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
      }
    );
  },

  presentScan: (req, res, next) => {
    console.log("Check if this SKU was scanned today");
    const upc = req.body.upc;
    connection.query(
      `SELECT * from wo_scan where scan_upc = '` + upc + "'",
      [],
      (error, results, fields) => {
        console.log("76 = " + JSON.stringify(results));
        if (error) {
          console.log(error);
          next(
            res.status(500).json({
              success: 0,
              message: "Database connection errror",
            })
          );
        }

        //console.log(results);

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
      }
    );
  },

  // get station data
  getStationData: (req, res, next) => {
    const body = [];
    const kitCode = req.body.kit_code;
    console.log("get stations");
    console.log(JSON.stringify(req.params), JSON.stringify(kitCode));
    //select lens_desc from planogram where lens_upc = 195071870871 AND kitcode = ''
    connection.query(
      `SELECT wo.kit_code, wo.wo_qty, wo.add_date, wo.start_date, wo.complete_date, wo.wo_id,wo.work_order,wo.prod_order,
    planogram.kit_desc,planogram.kit_upc,planogram.kit_code,planogram.kit_desc,planogram.kit_upc,
    planogram.tray_id,tray_kit_code,planogram.ws_name, planogram.tray_number,planogram.lens_upc,planogram.lens_desc,planogram.pos_col,planogram.pos_row,planogram.ws_id,planogram.ws_name,planogram.ws_number 
    from wo Inner join planogram 
    on wo.kit_code = planogram.kit_code
    where wo.kit_code = '` +
      kitCode +
      "' ORDER BY pos_row",
      [],
      (error, results, fields) => {
        console.log("Get Station Data: " + JSON.stringify(results));
        if (error) {
          console.log(error);
          next(
            res.status(500).json({
              success: 0,
              message: "Database connection errror",
            })
          );
        }

        //console.log(results);

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
      }
    );
  },

  getStationData1: (req, res, next) => {
    const body = [];
    let lensGoal = 0;
    var kitCode = req.params.kitcode;
    var stationid = req.params.ws_num;
    var traynumber = parseInt(req.params.traynumber);
    console.log("Request Planogram for a specific kit v2");
    console.log(JSON.stringify(req.params));
    //select lens_desc from planogram where lens_upc = 195071870871 AND kitcode = ''
    //Not taking tray_number into account is causing some render issues..
    //Modify query to have tray_number
    //Not sure how to get traynumber from a TrayLabel or TraylabelID; string parsing?
    //There's not correlation between wo_tray and the kits; we'll have to parse strings
    var query =
      "SELECT * from planogram where kit_code = ? AND  ws_number = ? AND tray_number = ?";
    console.log("Planogram query: " + query);
    connection.query(
      query,
      [kitCode, stationid, traynumber],
      (error, results, fields) => {
        console.log("Get Station Data sz: " + JSON.stringify(results).length);
        if (error) {
          console.log(error);
          next(
            res.status(500).json({
              success: 0,
              message: "Database connection errror",
            })
          );
        }

        //console.log(results);

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
      }
    );
  },

  getPlannogramDataForKitTray: (req, res, next) => {
    const body = [];
    var kitCode = req.params.kitCode;
    var trayCode = req.params.trayCode;
    console.log(
      `Request Planogram for a specific kit ${kitCode} - ${trayCode} `
    );
    console.log(JSON.stringify(req.params));
    //select lens_desc from planogram where lens_upc = 195071870871 AND kitcode = ''
    //Not taking tray_number into account is causing some render issues..
    //Modify query to have tray_number
    //Not sure how to get traynumber from a TrayLabel or TraylabelID; string parsing?
    //There's not correlation between wo_tray and the kits; we'll have to parse strings
    var query =
      "SELECT * from planogram where kit_code = ? AND tray_kit_code = ?";
    console.log("Planogram query: " + query);
    connection.query(query, [kitCode, trayCode], (error, results, fields) => {
      if (error) {
        console.log(error);
        next(
          res.status(500).json({
            success: 0,
            message: "Database connection errror",
          })
        );
      }

      //console.log(results);

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
  },

  getPlannogramDataForKitTrayndWS: (req, res, next) => {
    const body = [];
    var kitCode = req.params.kitCode;
    var stationId = req.params.ws_num;
    var trayCode = req.params.trayCode;
    console.log(
      `Request Planogram for a specific kit ${kitCode} - ${trayCode} - ${stationId} `
    );
    console.log(JSON.stringify(req.params));
    //select lens_desc from planogram where lens_upc = 195071870871 AND kitcode = ''
    //Not taking tray_number into account is causing some render issues..
    //Modify query to have tray_number
    //Not sure how to get traynumber from a TrayLabel or TraylabelID; string parsing?
    //There's not correlation between wo_tray and the kits; we'll have to parse strings
    var query =
      "SELECT * from planogram where kit_code = ? AND  ws_number = ? AND tray_kit_code = ?";
    console.log("Planogram query: " + query);
    connection.query(
      query,
      [kitCode, stationId, trayCode],
      (error, results, fields) => {
        if (error) {
          console.log(error);
          next(
            res.status(500).json({
              success: 0,
              message: "Database connection errror",
            })
          );
        }

        //console.log(results);

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
      }
    );
  },

  //

  getPlannogram: (req, res, next) => {
    const body = req.body;
    console.log("Scan Controller \n");
    console.log(req.params);

    //console.log(req,res,next);
    //We can do data shaping here, using the returned query
    var x = [];
    var y = [];
    var query = "SELECT kit_code from wo where work_order = ?";
    const wo = [req.wo];
    connection.query(query, wo, (error, results, fields) => {
      if (error) {
        console.log(err);
        next(
          res.status(500).json({
            success: 0,
            message: "Database connection errror",
          })
        );
      }

      next(
        res.status(200).json({
          success: 1,
          data: results,
        })
      );
    });
  },

  getWorkOrdersByID: (req, res) => {
    const id = req.params.id;
    getWorkOrdersByID(id, (err, results) => {
      if (err) {
        console.log(err);
        return;
      }
      if (!results) {
        return res.json({
          success: 0,
          message: "Record not Found",
        });
      }
      results.password = undefined;
      return res.json({
        success: 1,
        data: results,
      });
    });
  },

  getBOM: (req, res) => {
    const body = req.body;
    console.log("89 = " + JSON.stringify(body));

    getBOM(body, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).send(err);
      } else if (results.affectedRows === 0) {
        // No rows affected means no record was found with the given id
        return res.status(404).send({ message: "User not found" });
      }

      return res.json({
        success: 1,
        message: "updated successfully",
        data: results,
      });
    });
  },
  getBOMByID: (req, res) => {
    const body = req.body;
    console.log("89 = " + JSON.stringify(body));

    getBOMByID(body, (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).send(err);
      } else if (results.affectedRows === 0) {
        // No rows affected means no record was found with the given id
        return res.status(404).send({ message: "User not found" });
      }

      return res.json({
        success: 1,
        message: "updated successfully",
        data: results,
      });
    });
  },

  getDefaultPrinters: (req, res, next) => {
    console.log("Get default printers");

    // Get all printers and their assigned types
    const query = `
      SELECT cfg_name, cfg_path 
      FROM cfg 
      WHERE cfg_type = 'printer'
    `;

    connection.query(query, [], (error, results) => {
      if (error) {
        console.log(error);
        return res.status(500).json({
          success: 0,
          message: "Database connection error"
        });
      }

      // Build defaults: { tray: "printerName", cabinet: "printerName", pallet: "printerName" }
      const defaults = {
        tray: null,
        cabinet: null,
        pallet: null
      };

      results.forEach(row => {
        if (row.cfg_path) {
          try {
            // cfg_path is an array like ["TrayPrinter", "PacklotPrinter"]
            const assignedTypes = JSON.parse(row.cfg_path);
            if (Array.isArray(assignedTypes)) {
              if (assignedTypes.includes('TrayPrinter')) {
                defaults.tray = row.cfg_name;
              }
              if (assignedTypes.includes('PacklotPrinter')) {
                defaults.cabinet = row.cfg_name;
              }
              if (assignedTypes.includes('PalletPrinter')) {
                defaults.pallet = row.cfg_name;
              }
            }
          } catch (e) {
            console.log('Error parsing cfg_path JSON:', e);
          }
        }
      });

      res.status(200).json({
        success: 1,
        data: defaults
      });
    });
  },

  // Get all work orders (including closed ones) - for manager/supervisor access
  getWorkOrdersByDateRange: (req, res, next) => {
    const body = [];
    const startDate = req.query.startDate; // timestamp in milliseconds from frontend
    const endDate = req.query.endDate; // timestamp in milliseconds from frontend
    const includeCompleted = req.query.includeCompleted === 'true';

    // Convert milliseconds to seconds (database stores timestamps in seconds)
    const startDateSeconds = Math.floor(parseInt(startDate) / 1000);
    const endDateSeconds = Math.floor(parseInt(endDate) / 1000);

    console.log("=== Get Work Orders By Date Range ===");
    console.log(`Start: ${startDateSeconds} (${new Date(startDateSeconds * 1000).toISOString()})`);
    console.log(`End: ${endDateSeconds} (${new Date(endDateSeconds * 1000).toISOString()})`);
    console.log(`Include Completed: ${includeCompleted}`);

    let query;
    let queryParams = [];

    if (includeCompleted) {
      if (startDate && endDate) {
        // Show ALL open work orders + closed work orders within date range
        query = `
          SELECT work_order, prod_order, wo_id, kit_code, add_date, start_date, complete_date, wo_qty
          FROM wo 
          WHERE complete_date = '' 
             OR (complete_date != '' AND CAST(add_date AS SIGNED) >= ? AND CAST(add_date AS SIGNED) <= ?)
          ORDER BY 
            CASE WHEN complete_date = '' THEN 0 ELSE 1 END,
            CAST(add_date AS SIGNED) DESC
        `;
        queryParams = [startDateSeconds, endDateSeconds];
        console.log(`Query params (seconds): ${queryParams[0]} to ${queryParams[1]}`);
      } else {
        // No date filter - return all
        query = `
          SELECT work_order, prod_order, wo_id, kit_code, add_date, start_date, complete_date, wo_qty
          FROM wo 
          ORDER BY 
            CASE WHEN complete_date = '' THEN 0 ELSE 1 END,
            CAST(add_date AS SIGNED) DESC
        `;
      }
    } else {
      // Only incomplete work orders (current behavior)
      query = `SELECT work_order, prod_order, wo_id, kit_code, add_date, start_date, complete_date, wo_qty FROM wo WHERE complete_date = ''`;
    }

    connection.query(query, queryParams, (error, results, fields) => {
      if (error) {
        console.log("Database error:", error);
        return res.status(500).json({
          success: 0,
          message: "Database connection error",
        });
      }

      console.log(`Found ${results ? results.length : 0} work orders`);

      if (results) {
        results.forEach((element) => {
          body.push(element);
        });
      }

      return res.status(200).json({
        success: 1,
        data: body,
      });
    });
  },

  // Search for work orders by work order number (includes closed)
  searchWorkOrders: (req, res, next) => {
    const searchTerm = req.query.search || '';
    const body = [];

    console.log("=== Search Work Orders ===");
    console.log(`Search term: ${searchTerm}`);

    if (!searchTerm || searchTerm.length < 2) {
      return res.status(200).json({
        success: 1,
        data: [],
        message: 'Please enter at least 2 characters to search'
      });
    }

    const query = `
      SELECT work_order, prod_order, wo_id, kit_code, add_date, start_date, complete_date, wo_qty
      FROM wo 
      WHERE work_order LIKE ?
      ORDER BY 
        CASE WHEN complete_date = '' THEN 0 ELSE 1 END,
        CAST(add_date AS SIGNED) DESC
      LIMIT 50
    `;
    const queryParam = `%${searchTerm}%`;

    connection.query(query, [queryParam], (error, results, fields) => {
      if (error) {
        console.log("Database error:", error);
        return res.status(500).json({
          success: 0,
          message: "Database connection error",
        });
      }

      console.log(`Found ${results ? results.length : 0} work orders matching '${searchTerm}'`);

      if (results) {
        results.forEach((element) => {
          body.push(element);
        });
      }

      return res.status(200).json({
        success: 1,
        data: body,
      });
    });
  },
};
