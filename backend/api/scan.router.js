const router = require("express").Router();

const {
  createScan,
  getBOM,
  getIncompleteWorkOrder,
  getWorkOrdersByID,
  getBOMByID,
  getPlannogram,
  reprintCartonLabel,
  printWorkOrder,
  getPrinters,
  printCabinetLabel,
  printPalletLabel,
  fetchWorkOrderCabinets,
  fetchWorkOrderTrays,
  printCabinetLabelByCabinetLabel,
  printTrayLabelByTrayLabel,
  printCartonLabelByCartonLabel,
  getTrayIdData,
  printCartonLabel,
  getTrayIdData1,
  getStationCount,
  getStationData1,
  deleteScan,
  checkCabinetAlreadyScanned,
  checkCabinet,
  checkTrayLabel,
  getTrayCount,
  pushKit,
  getCompletedCabinet,
  getExistingScans,
  getPrinterByName,
  validateScan,
  passwordCheck,
  passwordCheckPrintStation,
  getTrayLabelsForSelection,
  getPalletLabelsForSelection,
  getCabinetLabelsForSelection,
  printSelectedTrayLabels,
  printSelectedPalletLabels,
  printSelectedCabinetLabels,
  fetchMasterTraysByKitCode,
  fetchMasterKits,
  updateConfigLineStations,
  getPlannogramDataForKitTrayndWS,
  getPlannogramDataForKitTray,
  getDefaultPrinters,
  getWorkOrdersByDateRange,
  searchWorkOrders,
} = require("./scan.controller");
const { checkToken } = require("../auth/token_validation");

router.post("/submit_scan", function (req, res, next) {
  createScan(req, res, next);
});

router.get(
  "/validate_scan/:upc/:kitcode/:trayNumber/:station",
  function (req, res, next) {
    validateScan(req, res, next);
  }
);

router.post("/checkcabinet/:wo_id/:cabinetlabel", function (req, res, next) {
  checkCabinet(req, res, next);
});

router.post(
  "/checkCabinetAlreadyScanned/:cabinetlabel",
  function (req, res, next) {
    checkCabinetAlreadyScanned(req, res, next);
  }
);

router.post("/checktray/:wo_id/:traylabel", async function (req, res, next) {
  await checkTrayLabel(req, res, next);
});

router.get("/getKitInfo/:kit_code/", function (req, res, next) {
  getTrayCount(req, res, next);
});

router.get(
  "/getCompleteCabinet/:cabinetlabel/:wo_id",
  function (req, res, next) {
    getCompletedCabinet(req, res, next);
  }
);

router.get("/passwordCheck/:pswd/", function (req, res, next) {
  passwordCheck(req, res, next);
});

router.get("/passwordCheckPrintStation/:pswd/", function (req, res, next) {
  passwordCheckPrintStation(req, res, next);
});

router.post("/pushKit/", function (req, res, next) {
  //TODO: Consider Validations
  pushKit(req, res, next);
});

router.delete("/remove_scan/:scanid", function (req, res, next) {
  console.log("Scan removal entry point");
  deleteScan(req, res, next);
});
router.post("/print_wo/:wo", function (req, res, next) {
  console.log("print_wo entry point");
  printWorkOrder(req, res, next);
});

router.post("/print_cabinetlabel/:wo", function (req, res, next) {
  console.log("print_cabinetlabel by wo entry point");
  printCabinetLabel(req, res, next);
});

router.post("/print_palletlabel/:wo", function (req, res, next) {
  console.log("print_palletlabel by wo entry point");
  printPalletLabel(req, res, next);
});

router.get("/get_tray_labels_for_selection/:wo", function (req, res, next) {
  console.log("get_tray_labels_for_selection entry point");
  getTrayLabelsForSelection(req, res, next);
});

router.get("/get_pallet_labels_for_selection/:wo", function (req, res, next) {
  console.log("get_pallet_labels_for_selection entry point");
  getPalletLabelsForSelection(req, res, next);
});

router.get("/get_cabinet_labels_for_selection/:wo", function (req, res, next) {
  console.log("get_cabinet_labels_for_selection entry point");
  getCabinetLabelsForSelection(req, res, next);
});

router.post("/print_selected_tray_labels", function (req, res, next) {
  console.log("print_selected_tray_labels entry point");
  printSelectedTrayLabels(req, res, next);
});

router.post("/print_selected_pallet_labels", function (req, res, next) {
  console.log("print_selected_pallet_labels entry point");
  printSelectedPalletLabels(req, res, next);
});

router.post("/print_selected_cabinet_labels", function (req, res, next) {
  console.log("print_selected_cabinet_labels entry point");
  printSelectedCabinetLabels(req, res, next);
});

router.get("/wo_cabinet", function (req, res, next) {
  console.log("print_cabinetlabel by cabinet_label entry point");
  fetchWorkOrderCabinets(req, res, next);
});

router.get("/wo_tray", function (req, res, next) {
  console.log("print_traylabel by tray_label entry point");
  fetchWorkOrderTrays(req, res, next);
});

router.post("/print/cabinetlabel", function (req, res, next) {
  console.log("print_cabinetlabel by cabinet_label entry point");
  printCabinetLabelByCabinetLabel(req, res, next);
});

router.post("/print/traylabel", function (req, res, next) {
  console.log("print_traylabel by tray_label entry point");
  printTrayLabelByTrayLabel(req, res, next);
});

router.post("/print/cartonLabel", function (req, res, next) {
  //Should
  console.log("reprint_cartonlabel by cartonLabel entry point");
  printCartonLabelByCartonLabel(req, res, next);
});

router.post("/print_carton/", function (req, res, next) {
  console.log("print_carton entry point");
  printCartonLabel(req, res, next);
  1;
});

router.post("/reprint_carton/:cartonLabel", function (req, res, next) {
  //Should
  console.log("reprint_carton entry point");
  reprintCartonLabel(req, res, next);
});

router.get("/master_kits", function (req, res, next) {
  console.log("Fetch Master Kits");
  fetchMasterKits(req, res, next);
});

router.get(
  "/master_kits/:master_kit_code/master_trays",
  function (req, res, next) {
    console.log("Fetch Master Trays");
    fetchMasterTraysByKitCode(req, res, next);
  }
);

router.put("/cfg_line/stations", function (req, res, next) {
  console.log("Update Config Line Status");
  updateConfigLineStations(req, res, next);
});

router.post("/woid", function (req, res, next) {
  console.log("got woid");
  getWonData(req, res, next);
});

router.get(
  "/trayid1/:trayidlabel/:ws_id",
  // checkToken,
  function (req, res, next) {
    console.log("Tray ID Endpoint entry v2");
    console.log(next);
    getTrayIdData1(req, res, next);
  }
);

router.get("/existing-scans/:trayId/:stationId", function (req, res, next) {
  getExistingScans(req, res, next);
});

router.get(
  "/trayid",
  // checkToken,
  function (req, res, next) {
    console.log(" Tray data");
    console.log(next);
    getTrayIdData(req, res, next);
  }
);

router.get(
  "/stationct/:kitid",
  // checkToken,
  function (req, res, next) {
    console.log("Querying Station COunt");
    console.log(next);
    getStationCount(req, res, next);
  }
);

router.post("/woid", function (req, res, next) {
  console.log("got woid");
  getWonData(req, res, next);
});

router.get("/get_bom", /*checkToken*/ getBOM);
//router.get("/getwobyid", checkToken, getIncompleteWorkOrders); //Should Return Json of WO, Plannogram getwobyid
router.get(
  "/getwo/:wo",
  /*checkToken*/ function (req, res, next) {
    console.log("Scan router");
    console.log(next);
    getPlannogram(req, res, next);
  }
);

router.get(
  "/getic",
  // checkToken,
  function (req, res, next) {
    console.log("Get Incomplete");
    console.log(next);
    getIncompleteWorkOrder(req, res, next);
  }
);

// Get work orders by date range (manager/supervisor access - includes closed work orders)
router.get(
  "/workorders/bydate",
  // checkToken,
  function (req, res, next) {
    console.log("Get Work Orders By Date Range");
    getWorkOrdersByDateRange(req, res, next);
  }
);

/*
 router.post("/getstation",
  // checkToken, 
  function (req,res,next)
 {
  console.log("getstation");
  console.log(next);
  getStationData(req,res,next);
 });
*/

router.get(
  "/getstation/:kitcode/:ws_num/:traynumber/",
  // checkToken,
  function (req, res, next) {
    console.log("getstation");
    console.log(next);
    getStationData1(req, res, next);
  }
);

router.get(
  "/planogram/:kitCode/:trayCode/:ws_num/",
  // checkToken,
  function (req, res, next) {
    console.log("getPlanogram");
    console.log(next);
    getPlannogramDataForKitTrayndWS(req, res, next);
  }
);

router.get(
  "/planogram/:kitCode/:trayCode/",
  // checkToken,
  function (req, res, next) {
    console.log("getPlanogram");
    console.log(next);
    getPlannogramDataForKitTray(req, res, next);
  }
);

router.get(
  "/getPrinters",
  // checkToken,
  function (req, res, next) {
    console.log("getPrinters");
    console.log(next);
    getPrinters(req, res, next);
  }
);

router.get("/printers/:printer_name", function (req, res, next) {
  console.log("Fetch printer by name");
  console.log(next);
  getPrinterByName(req, res, next);
});

router.get("/getbombyid", /*checkToken*/ getBOMByID);

router.get("/default_printers", function (req, res, next) {
  console.log("Get default printers");
  getDefaultPrinters(req, res, next);
});

// Search work orders by work order number (includes closed)
router.get("/workorders/search", function (req, res, next) {
  console.log("Search Work Orders");
  searchWorkOrders(req, res, next);
});

module.exports = router;
