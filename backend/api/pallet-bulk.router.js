const router = require("express").Router();
const controller = require("./pallet-bulk.controller");

router.post("/print", controller.printBulkPalletLabels);
router.get("/printers", controller.getPrinters);

module.exports = router;
