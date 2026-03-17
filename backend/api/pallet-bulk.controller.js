const connection = require("../config/database");
const printer = require("../utilities/printerInterface");

module.exports = {
  /**
   * Print pallet labels from spreadsheet data
   * Expects body: { pallets: [{ wo_palletlabel, kit_code, kit_desc? }], printer_name }
   */
  printBulkPalletLabels: (req, res, next) => {
    const { pallets, printer_name } = req.body;

    console.log('=== PALLET BULK PRINT REQUEST ===');
    console.log('Received pallets:', JSON.stringify(pallets));
    console.log('Pallet count:', pallets ? pallets.length : 0);

    if (!pallets || !Array.isArray(pallets) || pallets.length === 0) {
      return res.status(400).json({
        success: 0,
        message: "No pallet data provided"
      });
    }

    if (!printer_name) {
      return res.status(400).json({
        success: 0,
        message: "Printer name is required"
      });
    }

    // Get printer details
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

        // If only one pallet selected, treat as intentional reprint - skip the "already printed" check
        const isSingleReprint = pallets.length === 1;

        if (isSingleReprint) {
          // Single label - print it regardless of print status
          const kitCodes = [...new Set(pallets.map(p => p.kit_code))];
          
          connection.query(
            `SELECT kit_code, kit_desc FROM master_kit WHERE kit_code IN (?)`,
            [kitCodes],
            (kitError, kitResults) => {
              if (kitError) {
                console.log(kitError);
                return res.status(500).json({
                  success: 0,
                  message: "Database error fetching kit info"
                });
              }

              const kitMap = {};
              kitResults.forEach(k => {
                kitMap[k.kit_code] = k.kit_desc;
              });

              const enrichedPallets = pallets.map(p => ({
                wo_palletlabel: p.wo_palletlabel,
                kit_code: p.kit_code,
                kit_desc: kitMap[p.kit_code] || p.kit_code,
                work_order: p.work_order
              })).sort((a, b) => a.wo_palletlabel.localeCompare(b.wo_palletlabel));

              console.log('Single reprint - enrichedPallets (sorted):', JSON.stringify(enrichedPallets));

              try {
                const palletLabels = printer.makePalletLabel(enrichedPallets);
                console.log('ZPL message count:', palletLabels.printmessage.length);
                printer.createPrint(printer_ip, printer_port, palletLabels);
                console.log(`Reprinted 1 pallet label to ${printer_ip}:${printer_port}`);
              } catch (error) {
                console.error('Print error:', error);
                return res.status(500).json({
                  success: 0,
                  message: "Failed to send print job to printer"
                });
              }

              // Update print date
              const currentTime = Date.now();
              connection.query(
                `UPDATE wo_pallet SET wo_palletlabel_printdate = ? WHERE wo_palletlabel = ?`,
                [currentTime, pallets[0].wo_palletlabel],
                (updateError, updateResults) => {
                  if (updateError) {
                    console.error('Error updating printdate:', updateError);
                  }

                  res.status(200).json({
                    success: 1,
                    message: `Successfully printed pallet label ${pallets[0].wo_palletlabel}`,
                    printed: 1,
                    skipped: 0,
                    dbRowsUpdated: updateResults ? updateResults.affectedRows : 0
                  });
                }
              );
            }
          );
          return;
        }

        // Multiple pallets - filter out already printed ones
        // Get pallet labels from request
        const requestedPalletLabels = pallets.map(p => p.wo_palletlabel);

        // Check which pallets have NOT been printed yet
        connection.query(
          `SELECT wo_palletlabel FROM wo_pallet WHERE wo_palletlabel IN (?) AND (wo_palletlabel_printdate IS NULL OR wo_palletlabel_printdate = '' OR wo_palletlabel_printdate = 0)`,
          [requestedPalletLabels],
          (unprintedError, unprintedResults) => {
            if (unprintedError) {
              console.log(unprintedError);
              return res.status(500).json({
                success: 0,
                message: "Database error checking print status"
              });
            }

            // Get list of unprinted pallet labels
            const unprintedLabels = new Set(unprintedResults.map(r => r.wo_palletlabel));
            
            // Filter to only unprinted pallets
            const palletsToprint = pallets.filter(p => unprintedLabels.has(p.wo_palletlabel));
            const skippedCount = pallets.length - palletsToprint.length;

            if (palletsToprint.length === 0) {
              return res.status(200).json({
                success: 1,
                message: `All ${pallets.length} pallet labels have already been printed`,
                printed: 0,
                skipped: skippedCount,
                alreadyPrinted: true
              });
            }

            // Get unique kit codes to fetch descriptions
            const kitCodes = [...new Set(palletsToprint.map(p => p.kit_code))];
            
            connection.query(
              `SELECT kit_code, kit_desc FROM master_kit WHERE kit_code IN (?)`,
              [kitCodes],
              (kitError, kitResults) => {
                if (kitError) {
                  console.log(kitError);
                  return res.status(500).json({
                    success: 0,
                    message: "Database error fetching kit info"
                  });
                }

                // Create kit lookup map
                const kitMap = {};
                kitResults.forEach(k => {
                  kitMap[k.kit_code] = k.kit_desc;
                });

                // Enrich pallet data with kit descriptions and sort by pallet label
                const enrichedPallets = palletsToprint.map(p => ({
                  wo_palletlabel: p.wo_palletlabel,
                  kit_code: p.kit_code,
                  kit_desc: kitMap[p.kit_code] || p.kit_code, // fallback to kit_code if no desc
                  work_order: p.work_order
                })).sort((a, b) => a.wo_palletlabel.localeCompare(b.wo_palletlabel));

                console.log(`Printing ${enrichedPallets.length} pallets in order:`, enrichedPallets.map(p => p.wo_palletlabel).join(', '));

                // Generate and print labels
                try {
                  const palletLabels = printer.makePalletLabel(enrichedPallets);
                  printer.createPrint(printer_ip, printer_port, palletLabels);
                  console.log(`Printed ${enrichedPallets.length} pallet labels to ${printer_ip}:${printer_port} (skipped ${skippedCount} already printed)`);
                } catch (error) {
                  console.error('Print error:', error);
                  return res.status(500).json({
                    success: 0,
                    message: "Failed to send print job to printer"
                  });
                }

                // Update print dates for printed pallets only
                const currentTime = Date.now();
                const palletLabelsToUpdate = palletsToprint.map(p => p.wo_palletlabel);

                connection.query(
                  `UPDATE wo_pallet SET wo_palletlabel_printdate = ? WHERE wo_palletlabel IN (?)`,
                  [currentTime, palletLabelsToUpdate],
                  (updateError, updateResults) => {
                    if (updateError) {
                      console.error('Error updating printdate:', updateError);
                      // Still return success since print was sent
                      return res.status(200).json({
                        success: 1,
                        message: `Printed ${enrichedPallets.length} labels (skipped ${skippedCount} already printed), but failed to update print dates`,
                        printed: enrichedPallets.length,
                        skipped: skippedCount,
                        dbUpdateFailed: true
                      });
                    }

                    res.status(200).json({
                      success: 1,
                      message: `Successfully printed ${enrichedPallets.length} pallet labels` + (skippedCount > 0 ? ` (skipped ${skippedCount} already printed)` : ''),
                      printed: enrichedPallets.length,
                      skipped: skippedCount,
                      dbRowsUpdated: updateResults.affectedRows
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  },

  /**
   * Get all available printers
   */
  getPrinters: (req, res, next) => {
    connection.query(
      `SELECT cfg_id, cfg_name, cfg_ipaddress, cfg_port FROM cfg WHERE cfg_type = 'printer'`,
      [],
      (error, results) => {
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
  }
};
