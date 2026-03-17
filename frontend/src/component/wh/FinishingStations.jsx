
import React, { useEffect, useState, useCallback, useRef } from "react";
import './wh.scss';
// import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
// import { Box ,Typography,AppBar, IconButton,Toolbar} from "@mui/material";
import { AppBar, Toolbar, Typography, Grid, Box } from '@mui/material';
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import InputData from "./InputData";
import { useNavigate } from 'react-router-dom';
import HandymanIcon from '@mui/icons-material/Handyman';
import { IconButton } from '@mui/material';
import { Fireworks } from 'fireworks-js'
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';
import PauseCircle from '@mui/icons-material/PauseCircle';
import InstantMessage from '../InstantMessage';
import GTranslateIcon from '@mui/icons-material/GTranslate';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';



// import CloseIcon from '@mui/icons-material/Close';
// import StarBorderPurple500Icon from '@mui/icons-material/StarBorderPurple500';
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};


const FinishingStations = () => {

  const [languageState, setLanguageState] = useState("en");
  const [workOrder, setWorkOrder] = useState([]);
  const [renderComplete, setRenderComplete] = useState([]);
  const [scannedUPC, setScannedUPC] = useState([]);
  const [lensDesc, setLensDesc] = useState([]);
  const [LensCount, setLensCount] = useState(0);
  const [currentPos, setCurrentPos] = useState({ "row": 0, "col": 0 }); //set row,col with trackPos
  const [completeTray, setCompleteTray] = useState(false);
  const [lastLensInsert, setLastLensInsert] = useState(() => {
    const storedId = localStorage.getItem("lastSubmissionID");
    return storedId ? storedId : null;
  });

  const navigate = useNavigate();
  const [isDecrementing, setIsDecrementing] = useState(false);

  const [removedScans, setRemovedScans] = useState(0);

  const [isRemoving, setIsRemoving] = useState(false);
  const [operationQueue, setOperationQueue] = useState([]);
  const [currentLensCount, setCurrentLensCount] = useState(() => {
    return parseInt(localStorage.getItem("nLens") || "0", 10);
  });
  const isResettingRef = useRef(false);
  const [lensGoal, setLensGoal] = useState(null);
  const [passwordCheckDialogOpen, setPasswordCheckDialogOpen] = React.useState(false);
  const [passwordCheckDialogError, setPasswordCheckDialogError] = React.useState("");
  const [barCodeFieldValue, setBarCodeFieldValue] = React.useState("");
  const [upcValue, setUPCValue] = React.useState("");



  useEffect(() => {

    const debounceTimer = setTimeout(() => {
      console.log("---> useEffetc BarcodeChange invoked")
      if (barCodeFieldValue !== "")
        handleBarcodeChange()
    }, 1500);

    return () => clearTimeout(debounceTimer)
  }, [barCodeFieldValue]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      console.log("---> useEffect pushScan invoked")
      if (upcValue !== "")
        pushScan()
    }, 500);
    return () => clearTimeout(debounceTimer)
  }, [upcValue]);

  useEffect(() => {

    let kitcode = localStorage.getItem("kit_code");
    let station = localStorage.getItem("Station");
    let trayNumber = localStorage.getItem("trayNumber");
    let moddedPlanogram = [];


    resetCurrentLensCt();
    checkTrayAndPopulateCache();

    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/getstation/` + kitcode + "/" + station + "/" + trayNumber, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      },

    })
      .then((response) => response.json())
      .then((data) => {

        //TODO: Check for nulls
        setWorkOrder(data.data);

        if (!localStorage.getItem("Planogram")) {
          /*
          moddedPlanogram = data.data.map(item => ({
            ...item,
            Count: 0
          }));
          */
          localStorage.setItem("Planogram", JSON.stringify(data.data));
          let lensgoal = 0;
          for (let i = 0; i < data.data.length; i++) //Map this
          {
            if (data.data[i].lens_upc) {
              console.log(data.data[i]);
              lensgoal++;
            }
          }
          console.log("Calculated lensgoal " + lensgoal);
          localStorage.setItem("lensGoal", lensgoal);
        }
        console.log("----------------START------------------")
        let scanSession = localStorage.getItem("scanSession");
        scanSession = JSON.parse(scanSession);

        populateCacheStorage(scanSession);

        console.log("----------------END------------------")

        // setLoading(false);
        console.log(data);
        console.log(workOrder);
      })
      .catch((error) => console.log(error));

  }, []);

  useEffect(() => {
    const storedCount = parseInt(localStorage.getItem("nLens"));
    const storedGoal = parseInt(localStorage.getItem("lensGoal"));

    if (!isNaN(storedCount)) {
      setCurrentLensCount(storedCount);
    }

    if (!isNaN(storedGoal)) {
      setLensGoal(storedGoal);
    }
  }, []);

  const handleBarcodeChange = () => {
    let upc, exp, lotNum;

    // 1726033110143646209110020521
    /// 143646209110020521
    if (barCodeFieldValue.substring(0, 2) == "01") {
      upc = barCodeFieldValue.substring(4, 16)
      exp = "20" + barCodeFieldValue.substring(18, 24) + "000000"
      lotNum = barCodeFieldValue.substring(26)

      document.getElementById("lot-num").value = lotNum;
      document.getElementById("expiration-date").value = exp;
      document.getElementById("upc").value = upc;

      pushScan()

    } else if (barCodeFieldValue.substring(0, 2) == "17") {
      exp = "20" + barCodeFieldValue.substring(2, 8) + "000000"
      lotNum = barCodeFieldValue.substring(10)

      document.getElementById("unparsed-barcode").focus();
      document.getElementById("lot-num").value = lotNum;
      document.getElementById("expiration-date").value = exp;
      document.getElementById("upc").focus();
    } else {

    }
  }

  function checkTrayAndPopulateCache() {
    const trayidlabel = localStorage.getItem("trayLabel");
    const ws_id = localStorage.getItem('Station');

    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/trayid1/${trayidlabel}/${ws_id}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.success === 1) {
          localStorage.setItem("scanSession", JSON.stringify(data));
        } else {
          alert(data.message || 'Error fetching tray data');
        }
      })
      .catch((error) => {
        console.log(error);
        alert('Error fetching tray data');
      });
  }

  function populateCacheStorage(data) {

    localStorage.setItem("lensGoal", data.maxTrayQty);
    localStorage.setItem("nLens", data.currentScanCount);

    var lens = data.scanInfo.map((value, index, array) => {
      return value.lens_desc;
    })

    var prevLenses = {
      lens: lens
    };
    localStorage.setItem("nLens", data.currentScanCount);
    localStorage.setItem("prevLenses", JSON.stringify(prevLenses));
    localStorage.setItem("prev_lens", lens[lens.length - 1]);

    let planogram = localStorage.getItem("Planogram");
    planogram = JSON.parse(planogram);

    const lens_max_count = new Map()
    planogram.forEach(item => {
      if (lens_max_count.has(item.lens_desc)) {
        lens_max_count.set(item.lens_desc, lens_max_count.get(item.lens_desc) + 1);
      } else {
        lens_max_count.set(item.lens_desc, 1);
      }
    })

    // TSM1DMFN86-0275HI 
    //  {"max_lens_ct":2,"scanned_lens_ct":1,"current_lens_ct":1,"tray_id":0,"lens_exp_date":0,"render_state":false}
    //  {"max_lens_ct":2,"scanned_lens_ct":2,"current_lens_ct":2,"tray_id":0,"lens_exp_date":0,"render_state":true} 

    const scanned_lenses = new Map();
    data.scanInfo.forEach((scanned_lens, index) => {

      if (scanned_lenses.has(scanned_lens["lens_desc"])) {
        var lens_store = scanned_lenses.get(scanned_lens["lens_desc"])
        lens_store.scanned_lens_ct = lens_store.scanned_lens_ct + 1;
        //lens_store.current_lens_ct = lens_store.current_lens_ct + 1;
        lens_store.render_state = true
        scanned_lenses.set(scanned_lens["lens_desc"], lens_store)
      } else {
        var lens_store = {
          max_lens_ct: lens_max_count.get(scanned_lens["lens_desc"]),
          scanned_lens_ct: 1, //finalized scanned lenses
          current_lens_ct: 0, //lenses rendered in current scene
          tray_id: data.trayInfo.wo_tray_id,
          lens_exp_date: 0,
          render_state: true //true while scanned_lens_ct <= current_lens_ct; false otherwise
        };
        scanned_lenses.set(scanned_lens["lens_desc"], lens_store)
      }
    });
    console.log(scanned_lenses)

    scanned_lenses.forEach((scan_info, lens_desc) => {
      localStorage.setItem(lens_desc, JSON.stringify(scan_info));
    });

    // Planogram
    // [{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632830","lens_desc":"TSM1DMFN86-0350HI","pos_col":1,"pos_row":21,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632847","lens_desc":"TSM1DMFN86-0325HI","pos_col":1,"pos_row":20,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632847","lens_desc":"TSM1DMFN86-0325HI","pos_col":1,"pos_row":19,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632854","lens_desc":"TSM1DMFN86-0300HI","pos_col":1,"pos_row":18,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632854","lens_desc":"TSM1DMFN86-0300HI","pos_col":1,"pos_row":17,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334631291","lens_desc":"TSM1DMFN86-0275HI","pos_col":1,"pos_row":16,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334631291","lens_desc":"TSM1DMFN86-0275HI","pos_col":1,"pos_row":15,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633028","lens_desc":"TSM1DMFN86-0250HI","pos_col":1,"pos_row":14,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633028","lens_desc":"TSM1DMFN86-0250HI","pos_col":1,"pos_row":13,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633110","lens_desc":"TSM1DMFN86-0225HI","pos_col":1,"pos_row":12,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633110","lens_desc":"TSM1DMFN86-0225HI","pos_col":1,"pos_row":11,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633127","lens_desc":"TSM1DMFN86-0200HI","pos_col":1,"pos_row":10,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633127","lens_desc":"TSM1DMFN86-0200HI","pos_col":1,"pos_row":9,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633134","lens_desc":"TSM1DMFN86-0175HI","pos_col":1,"pos_row":8,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633141","lens_desc":"TSM1DMFN86-0150HI","pos_col":1,"pos_row":7,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633158","lens_desc":"TSM1DMFN86-0125HI","pos_col":1,"pos_row":6,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633165","lens_desc":"TSM1DMFN86-0100HI","pos_col":1,"pos_row":5,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633172","lens_desc":"TSM1DMFN86-0075HI","pos_col":1,"pos_row":4,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633189","lens_desc":"TSM1DMFN86-0050HI","pos_col":1,"pos_row":3,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633196","lens_desc":"TSM1DMFN86-0025HI","pos_col":1,"pos_row":2,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632861","lens_desc":"TSM1DMFN86-0000HI","pos_col":1,"pos_row":1,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632786","lens_desc":"TSM1DMFN86-0475HI","pos_col":2,"pos_row":10,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632793","lens_desc":"TSM1DMFN86-0450HI","pos_col":2,"pos_row":9,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632793","lens_desc":"TSM1DMFN86-0450HI","pos_col":2,"pos_row":8,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632809","lens_desc":"TSM1DMFN86-0425HI","pos_col":2,"pos_row":7,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632809","lens_desc":"TSM1DMFN86-0425HI","pos_col":2,"pos_row":6,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632816","lens_desc":"TSM1DMFN86-0400HI","pos_col":2,"pos_row":5,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632816","lens_desc":"TSM1DMFN86-0400HI","pos_col":2,"pos_row":4,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632823","lens_desc":"TSM1DMFN86-0375HI","pos_col":2,"pos_row":3,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632823","lens_desc":"TSM1DMFN86-0375HI","pos_col":2,"pos_row":2,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632830","lens_desc":"TSM1DMFN86-0350HI","pos_col":2,"pos_row":1,"ws_id":1,"ws_name":"Station 1","ws_number":1}]

  }

  const getStorageValues = useCallback(() => {
    const storedCount = localStorage.getItem("nLens");
    const storedGoal = localStorage.getItem("lensGoal");
    return {
      count: storedCount !== null ? parseInt(storedCount, 10) : null,
      goal: storedGoal !== null ? parseInt(storedGoal, 10) : null
    };
  }, []);

  function endTrayConf() {
    return (
      <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
        Tray Complete!.
      </Alert>
    );
  }





  //console.log(workOrder)
  const checkTrayCompletion = useCallback(() => {
    const { count, goal } = getStorageValues();
    console.log(`Checking completion: Current count ${count}, Goal ${goal}`);

    if (count === null || goal === null) {
      console.log("Count or goal not set yet, skipping completion check");
      return;
    }

    if (count === goal && !isResettingRef.current) {
      console.log("Tray complete, resetting");
      isResettingRef.current = true;
      endTrayConf();
      startFw();
      setTimeout(() => {
        resetTraySession();
        isResettingRef.current = false;
      }, 5000);
    } else {
      console.log("Tray not complete yet");
    }
  }, [getStorageValues]);

  // Initialize state from localStorage
  useEffect(() => {
    const { count, goal } = getStorageValues();
    setCurrentLensCount(count);
    setLensGoal(goal);
    console.log(`Initialized: Count ${count}, Goal ${goal}`);
  }, [getStorageValues]);

  useEffect(() => {
    if (currentLensCount !== null) {
      localStorage.setItem("nLens", currentLensCount.toString());
      if (!isResettingRef.current) {
        checkTrayCompletion();
      }
    }
  }, [currentLensCount, checkTrayCompletion]);

  useEffect(() => {
    if (lensGoal !== null) {
      localStorage.setItem("lensGoal", lensGoal.toString());
      checkTrayCompletion();
    }
  }, [lensGoal, checkTrayCompletion]);

  const setGoal = useCallback((newGoal) => {
    console.log(`Setting new goal: ${newGoal}`);
    setLensGoal(newGoal);
  }, []);



  const incLens = useCallback(() => {
    const { count } = getStorageValues();
    const newCount = (count || 0) + 1;
    localStorage.setItem("nLens", newCount.toString());
    setCurrentLensCount(newCount);
    console.log("Incrementing lens counter to", newCount);
    checkTrayCompletion();
  }, [getStorageValues, checkTrayCompletion]);



  useEffect(() => {
    if (currentLensCount !== null) {
      localStorage.setItem("nLens", currentLensCount.toString());
      if (!isResettingRef.current) {
        checkTrayCompletion();
      }
    }
  }, [currentLensCount, checkTrayCompletion]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "lensGoal") {
        const newGoal = parseInt(e.newValue, 10);
        if (!isNaN(newGoal) && newGoal !== lensGoal) {
          setLensGoal(newGoal);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [lensGoal]);





  function isMaxLens() {
    //check for max lens condition by iteration through prevLenses
    //fire true once the condition met

    let fullTray = false;
    let prevLenses = localStorage.getItem("prevLenses");
    //JSON.stringify(s).replace(/\\"/g, '"')
    prevLenses = JSON.parse(prevLenses);
    console.log("Prev Lenses array: " + JSON.stringify(prevLenses));
    prevLenses['lens'].forEach(element => {
      console.log("isMaxLens() Current lens: " + JSON.stringify(element));
      let currentLens = localStorage.getItem(JSON.stringify(element).replace(/\\"/g, '"'));
      console.log("Access lens: " + currentLens);
      console.log("Cleaned lens desc: " + JSON.stringify(element).replace(/\\"/g, '"'));

      if (currentLens) {
        console.log("Lens count difference: " + parseInt(element.max_lens_ct) - parseInt(element.current_lens_ct_));
      }
      else {
        console.log("IsMaxLens found no match for: " + JSON.stringify(element));
      }

    })
  }

  function startFw() {
    const fw_container = document.getElementById('appbar');
    const fireworks = new Fireworks(fw_container, {
      autoresize: true, opacity: 0.5,
      acceleration: 1.05,
      friction: 0.97,
      gravity: 1.5,
      particles: 100,
      traceLength: 8,
      traceSpeed: 10,
      explosion: 8
    });
    fireworks.start()
  }

  function findNthMatch(jsonObject, criteria, n) {
    // Convert JSON string to object if necessary
    const obj = typeof jsonObject === 'string' ? JSON.parse(jsonObject) : jsonObject;

    // Ensure we're working with an array
    const array = Array.isArray(obj) ? obj : [obj];

    // Filter the array based on the criteria
    const matches = array.filter(item => {
      return Object.keys(criteria).every(key => item[key] === criteria[key]);
    });

    // Return the nth match (n is 1-indexed)
    return matches[n - 1] || null;
  }

  function simulateScans() {
    //Populate manage lens with contents of tray from db


  }
  function manageLenses(key, count) {
    //isMaxLens();

    console.log("Manage Lenses of lens: " + (key));
    localStorage.setItem("prev_lens", key);
    if (localStorage.getItem("prevLenses")) {
      var prevLenses = JSON.parse(localStorage.getItem("prevLenses"));
      var lens = localStorage.getItem(key);

      var exist = prevLenses['lens'].find(element => element == key);

      if (!exist) {
        console.log("Adding new lens entry to prevLenses with value: " + key);
        prevLenses['lens'].push(key);
      }
      else {
        console.log("Lens: " + key + " has been added already")
      }
      localStorage.setItem("prevLenses", JSON.stringify(prevLenses));
    } else {
      localStorage.setItem("prevLenses", JSON.stringify({ lens: [key] }));
    }

    var lens_store = [];
    if (localStorage.getItem(key)) {
      lens_store = JSON.parse(localStorage.getItem(key));
      console.log("Lens state " + JSON.stringify(lens_store));
      if (lens_store['scanned_lens_ct'] + 1 <= lens_store['max_lens_ct']) {
        lens_store['scanned_lens_ct'] = lens_store['scanned_lens_ct'] + 1;
        lens_store['render_state'] = true;
      } else {
        alert("ManageLenses | Max lens count of: " + key + " already reached!");
        // let maxLens = window.confirm("Max lens count of: " + key + " already reached!","Test");

        //Need a callback or localStorage modification to prevent the insert on submitscan
        //removeScan();
        lens_store['render_state'] = false;
      }

      //lens_store['scanned_lens_ct'] = (lens_store['scanned_lens_ct']) + 1; 
      localStorage.setItem(key, JSON.stringify(lens_store));
    } else {
      //init scan object and set scanned count as 1, 
      console.log("manageLenses | creating new lens entry");

      var lens_store = {
        max_lens_ct: count,
        scanned_lens_ct: 1, //finalized scanned lenses
        current_lens_ct: 1, //lenses rendered in current scene
        tray_id: 0,
        lens_exp_date: 0,
        render_state: true, //true while scanned_lens_ct <= current_lens_ct; false otherwise

      };


      localStorage.setItem(key, JSON.stringify(lens_store));
      //localStorage.setItem("STATIONID",1);	
      setLensDesc(key);
      //setRenderComplete(key);
      //setLensCount(lens_store);
    }
    trackPos(key);
  }

  function setTrayID() {
    //set trayID from modal input field, if not null
    //set trayID in localstrorage

  }

  function trackPosByLesnUPC(lens_upc, total_lenses_count, payload) {
    if (localStorage.getItem("Planogram")) {
      let planogram = localStorage.getItem("Planogram");
      planogram = JSON.parse(planogram);
      let row = 0;
      let col = 0;
      for (var i = 0; i < planogram.length; i++) {

        if (planogram[i].lens_upc === lens_upc) {
          console.log("trackPos | Located a match, need to modify count from here");
          let lens_desc = planogram[i].lens_desc
          var currentLens = JSON.parse(localStorage.getItem(lens_desc)); // grab a copy  of the lenstore

          console.log("trackPos | Retrieved lens obj: " + JSON.stringify(currentLens));

          let scanned_lens_count = currentLens ? currentLens.scanned_lens_ct : 1;

          var delta = total_lenses_count - scanned_lens_count; // calculate current position to submit on this scan
          console.log("trackPos | LensCt delta for lens: " + lens_desc + " (" + delta + ")");
          if (delta <= 0) //TODO: Replace this 
          {
            delta = 1;
          }
          row = findNthMatch(planogram, { lens_desc: lens_desc }, delta).pos_row;
          col = findNthMatch(planogram, { lens_desc: lens_desc }, delta).pos_col;
          console.log("Deltath row is: " + row);
          console.log("Deltath col is: " + col);
          payload.pos = { "row": row, "col": col };
          break;
        }

      }

    }
    else {
      console.log("Track Pos found no planogram in localStorage");
    }
  }

  function trackPos(lens) {
    if (localStorage.getItem("Planogram")) {
      let planogram = localStorage.getItem("Planogram");
      planogram = JSON.parse(planogram);
      let row = 0;
      let col = 0;
      for (var i = 0; i < planogram.length; i++) {

        if (planogram[i].lens_desc === lens) {
          console.log("trackPos | Located a match, need to modify count from here");
          var currentLens = JSON.parse(localStorage.getItem(lens)); // grab a copy  of the lenstore

          console.log("trackPos | Retrieved lens obj: " + JSON.stringify(currentLens));

          var delta = currentLens.max_lens_ct - currentLens.scanned_lens_ct; // calculate current position to submit on this scan
          console.log("trackPos | LensCt delta for lens: " + lens + " (" + delta + ")");
          if (delta <= 0) //TODO: Replace this 
          {
            delta = 1;
          }
          row = findNthMatch(planogram, { lens_desc: lens }, delta).pos_row;
          col = findNthMatch(planogram, { lens_desc: lens }, delta).pos_col;
          console.log("Deltath row is: " + row);
          console.log("Deltath col is: " + col);
          setCurrentPos({ "row": row, "col": col });
          break;
        }

      }

    }
    else {
      console.log("Track Pos found no planogram in localStorage");
    }
  }

  function isExpiryDateValid(expiryDateString) {
    // Parse the expiry date string
    const year = parseInt(expiryDateString.substring(0, 4));
    const month = parseInt(expiryDateString.substring(4, 6)) - 1; // JavaScript months are 0-indexed
    const day = parseInt(expiryDateString.substring(6, 8));

    const expiryDate = new Date(year, month, day);
    const minExpireDate = new Date();
    minExpireDate.setMonth(minExpireDate.getMonth() + 13)

    // Set both dates to the start of the day for accurate comparison
    expiryDate.setHours(0, 0, 0, 0);
    minExpireDate.setHours(0, 0, 0, 0);

    // Check if the expiry date is 13 Months Later or in the future
    return expiryDate >= minExpireDate;
  }


  async function pushScan() {
    const getLocalStorageData = localStorage.getItem('data')


    //INFO: I like to comment out the following check for debugging; so I can just submit a UPC for planogram checking rather than the whole barcode field set

    const tray_id = localStorage.getItem("trayID");
    const station = localStorage.getItem("Station");
    const tray_number = localStorage.getItem("trayNumber");
    const kit_code = localStorage.getItem('kit_code');

    const lotNum = document.getElementById("lot-num").value;
    const upc = document.getElementById("upc").value;
    const expDate = document.getElementById("expiration-date").value;
    const barCode = document.getElementById("unparsed-barcode").value;

    if (!lotNum || !barCode || !expDate || !upc) {
      alert("Please fill in all fields");
      clearFieldVals();
      return;
    }

    if (!isExpiryDateValid(expDate)) {
      alert("Lens Expiry Date is expected to be dated atleast 13 months from today.");
      clearFieldVals();
      return;
    }
    var payload = {
      lotnum: lotNum,
      upc: upc,
      unparsed: barCode,
      expir: expDate,
      kitcode: kit_code,
      trayID: tray_id,
      traynumber: tray_number,
      station: station
    }

    await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/validate_scan/${upc}/${kit_code}/${tray_number}/${station}`, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${getLocalStorageData}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }
    }).then((response) => response.json())
      .then((data) => {
        trackPosByLesnUPC(upc, data.data.length, payload);
      })
      .catch((error) => console.log(error))


    console.log(currentPos)

    console.log(payload);

    await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/submit_scan/`, {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${getLocalStorageData}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',

      },
      body: JSON.stringify(payload)
    })
      .then((response) => response.json())
      .then((data) => {

        console.log("Push Scan Data: " + JSON.stringify(data));
        console.log(data);
        if (data['success'] == -1) {
          alert("Invalid Scan");
          clearFieldVals();
        }
        else if (data['success'] == 1) {
          console.log("Return from submit api: " + JSON.stringify(data));
          console.log("Keys: " + Object.keys(data));
          console.log("insertid: " + data['insertid']['insertId']);
          //updateLastInsert(data['insertid']['insertId']);
          manageLenses(data['data'][0]['lens_desc'], data['data'].length);
          clearFieldVals();
          resetCurrentLensCt();
        }
        else if (data['success'] == -2) {
          //alert("Invalid Scan");
          alert("Max Lens Count Reached");
          clearFieldVals();
        }
        else {
          alert("Malformed response");
          clearFieldVals();
        }
      }).catch((error) => { clearFieldVals(); console.log(error) })

    // 195071870871

    //resetCurrentLensCt();

    //From there, we can highlight the next matching lens_desc 
    //Future validation will make sure we don't exceed the expected lens_desc count for a kit.
  }



  const [open, setOpen] = React.useState(false);
  //const [trayID,setTrayID] = useState(false);

  //might use different names for these vars as wh gets more complex
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleTrayID = () => setTrayID(true);
  const handleTrayID_ = () => setTrayID(false);


  // const isDesktopOrLaptop = useMediaQuery({ minWidth: window.innerWidth})
  // const isBigScreen = useMediaQuery({ minWidth: 200 })
  // const isTabletOrMobile = useMediaQuery({ maxWidth: 1224 })
  // const isPortrait = useMediaQuery({ orientation: 'portrait' })
  // const isRetina = useMediaQuery({ minResolution: '2dppx' })



  const headerData = ["TI Row 1 Back/T1 Fila 1 Altras", "TI Row 2 Back/T1 Fila 2 Altras", "TI Row 3 Back/T1 Fila 3 Altras", "TI Row 4 Back/T1 Fila 4 Altras",
    "TI Row 5 Back/T1 Fila 5 Altras", "TI Row 6 Back/T1 Fila 6 Altras", "TI Row 7 Back/T1 Fila 7 Altras", "TI Row 8 Back/T1 Fila 8 Altras", "TI Row 9 Back/T1 Fila 9 Altras", "TI Row 10 Back/T1 Fila 10 Altras", "TI Row 11 Back/T1 Fila 11 Altras", "TI Row 12 Back/T1 Fila 12 Altras", "TI Row 13 Back/T1 Fila 13 Altras"
  ];
  const FE = ["TI Row 1 Front/T1 Fila 1 Altras", "TI Row 2 Front/T1 Fila 2 Altras"
    , "TI Row 3 Front/T1 Fila 3 Altras", "TI Row 4 Front/T1 Fila 4 Altras",
    "TI Row 5 Front/T1 Fila 5 Altras", "TI Row 6 Front/T1 Fila 6 Altras", "TI Row 7 Front/T1 Fila 7 Altras", "TI Row 8 Front/T1 Fila 8 Altras", "TI Row 9 Front/T1 Fila 9 Altras", "TI Row 10 Front/T1 Fila 10 Altras", "TI Row 11 Front/T1 Fila 11 Altras", "TI Row 12 Front/T1 Fila 12 Altras", "TI Row 13 Front/T1 Fila 13 Altras"
  ];
  const maxDynamicRowCount = workOrder.map(Obj => Obj.pos_row)
  const finalMaxDynamicRowCount = Math.max(...maxDynamicRowCount)

  const maxDynamicColCount = workOrder.map(Obj => Obj.pos_col)
  console.log("Max Dynamic Col Count: " + maxDynamicColCount);

  const finalMaxDynamicColCount = Math.max(...maxDynamicColCount)
  console.log("Final Max Dynamic Row Count: " + finalMaxDynamicRowCount)
  const maxRows = finalMaxDynamicRowCount;
  const maxHeaderColumns = finalMaxDynamicColCount; //SELECt max(pos_col),max(pos_row) from planogram where kit_code = "GMISIGHT630"  ORDER BY pos_col,pos_row;
  // Sample data for demonstration


  console.log("Work Order Length: " + workOrder.length)
  function clearFieldVals() {
    document.getElementById("lot-num").value = "";
    document.getElementById("upc").value = "";
    document.getElementById("unparsed-barcode").value = "";
    document.getElementById("expiration-date").value = "";

    setBarCodeFieldValue("");
    setUPCValue("")
    document.getElementById("unparsed-barcode").focus();
  }
  function incrementLensCount(value) {
    console.log("incrementLensCt");
    if (localStorage.getItem(value)) {
      let lens_store = JSON.parse(localStorage.getItem(value));
      console.log("Incrementing lens count for: " + value);
      lens_store['current_lens_ct'] = lens_store['current_lens_ct'] + 1;
      localStorage.setItem(value, JSON.stringify(lens_store));
      return true;
    }
    else {
      console.log("Increment failed, provided " + value + " lens has not been scanned");
      return false;

    }
  }

  function changeRenderState(value) {
    console.log("changeRenderState");
    if (localStorage.getItem(value)) {
      let lens_store = JSON.parse(localStorage.getItem(value));
      console.log("Changing render state for: " + value);
      lens_store['render_state'] = !(lens_store['render_state']);
      localStorage.setItem(value, JSON.stringify(lens_store));
      return true;
    }
    else {
      console.log("render_state change failed, provided " + value + " lens has not been scanned");
      return false;

    }
  }
  function getBackgroundColor(value) {
    //let render_state = false;

    //console.log("getBackgroundColor | Entry");
    if (localStorage.getItem(value)) {
      var lens_store = localStorage.getItem(value);
      lens_store = JSON.parse(lens_store);
      // render_state = lens_store['render_state'];
      console.log("Lens store for: " + value + " | " + JSON.stringify(lens_store));
      //scanned_lens_ct for any valid lens will always be at least 1
      //
      if (parseInt(lens_store['current_lens_ct']) < parseInt(lens_store['scanned_lens_ct'])) {

        incrementLensCount(value); //This does not effect the 'scanned_lens_ct' variable, but the 'current_count' which tracks rendered cells
        console.log("current_lens_ct of: " + value + " is less than scanned_lens_ct, returning green and incrementing");
        return 'green';
      } else if (parseInt(lens_store['current_lens_ct']) == parseInt(lens_store['scanned_lens_ct']) && (lens_store['render_state'] === true)) {
        //
        console.log("Current Lens count of: " + value + " is: " + parseInt(lens_store['current_lens_ct']));
        console.log("Current Scanned count of: " + value + " is " + parseInt(lens_store['scanned_lens_ct']));
        console.log("Reached proper value for: " + value + ".");
        changeRenderState(value); //Once we max out our current_lens_ct vs scanned_lens_ct we don't want to render the subsequent cells. We'll flip the renderState to false to allow a red cell to render. This flag will reset upon a new scan.. 
        return 'red';
      }
      else {
        console.log("How did we end up here?")
        return 'red';
      }

      /*
      if(lens_store['current_lens_ct']  === lens_store['scanned_lens_ct'])
      {
        
        console.log("Equal Count, returning green");
 
        console.log("All appropriate cells highlighted for lens, changing flag for: " + value);
        lens_store['render_state'] = false;
        localStorage.setItem(value,JSON.stringify(lens_store)); 
        return 'green';
      }
      else
      {
        console.log("All appropriate cells highlighted for lens: " + value);
       // return 'red';
      }
*/
    }
    else if (value !== "") {
      console.log("The lens:" + value + " has not been scanned yet")
      return 'red';
    }
    else {
      //blank space
      return 'red';
    }


    //console.log("getBackground stores: " + lens_store);
    //return value === localStorage.getItem(value) ? 'green' : 'red';

  }

  function splitContent(content) {
    // Split content into smaller chunks (e.g., every 10 characters)
    const chunks = [];
    for (let i = 0; i < content.length; i += 18) {
      chunks.push(content.substring(i, i + 18));
    }
    // Render each chunk within a span element
    return chunks.map((chunk, index) => <span key={index}>{chunk}<br /></span>);
  }

  function resetCurrentLensCt() {


    let val = localStorage.getItem("prev_lens");
    console.log("resetCurrentLensCt entry | val : " + val);

    var prevLenses = localStorage.getItem("prevLenses");
    if (prevLenses) {
      prevLenses = JSON.parse(prevLenses);
      incLens();

    }
    else {
      console.log("resetCurrentLensCt entry | array does not exist");

      return;
    }



    prevLenses['lens'].forEach(val => {

      if (localStorage.getItem(val)) {
        console.log("resetCurrentLensCt | Drawing complete, resetting current_lens_ct for lens: " + val);
        let lens_store = localStorage.getItem(val);
        lens_store = JSON.parse(lens_store);
        lens_store['current_lens_ct'] = 0;
        lens_store['render_state'] = true;
        //lens_store['scanned_lens_ct'] = lens_store['scanned_lens_ct'] + 1; 
        localStorage.setItem(val, JSON.stringify(lens_store))
      }
      else if (val !== null) {
        //alert("Could not find key: " + val);
        console.log("resetCurrentLensCt | Could not find key: " + val);
      }
      else {
        console.log("Null passed to resetCurrentLensCt");
      }

      // location.reload();

    });


  }



  const resetTraySession = useCallback(() => {

    //We need to clear lens counts, trayID, trayLabel
    //we can use the lenses stored in prevLenses array to identify the lenses to clear
    //in the future this should all be stored in the traySession object; which we can clear in one pass



    //Identify and Clear lenses:


    var currentLenses = [];
    if (localStorage.getItem("prevLenses")) //Could make this more robust by storing the vital things (station #, WO_ID, etc) in session storage; then just completely clearing localStorage
    {

      currentLenses = JSON.parse(localStorage.getItem("prevLenses"));
      console.log("resetTraySession | current lenses: count " + currentLenses.lens.length);

      for (var i = 0; i < currentLenses.lens.length; i++) {
        console.log("resetTraySession | targeted lens: " + currentLenses.lens[i])
        localStorage.removeItem(currentLenses.lens[i]);
      }
    }
    else {
      console.log("resetTraySession | no prev lenses found");
    }
    //console.log("resetTraySession | removing lens entry: " + currentLenses[i]);
    //  localStorage.removeItem(currentLenses[i]);
    setCurrentLensCount(0);
    console.log("resetTraySession | removing prevLenses object and related items");
    localStorage.removeItem("prevLenses");
    localStorage.removeItem("nLens");
    localStorage.removeItem("prev_lens");
    localStorage.removeItem("Planogram");
    localStorage.removeItem("trayLabel");
    localStorage.removeItem("trayID");
    localStorage.removeItem("traySession");
    localStorage.removeItem("lensGoal");
    navigate("/FinishingTrayId");
  }, []);


  const handleClickOpen = () => {
    setPasswordCheckDialogError("");
    setPasswordCheckDialogOpen(true);
  };

  const handlePasswordCheckDialogClose = () => {
    setPasswordCheckDialogOpen(false);
  };

  function clearLocalStorage(passcode) {


    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/passwordCheck/` + passcode, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => response.json())
      .then((data) => {
        if (data === null || !data.success) {
          return;
        }

        var currentLenses = [];
        if (localStorage.getItem("prevLenses")) //Could make this more robust by storing the vital things (station #, WO_ID, etc) in session storage; then just completely clearing localStorage
        {

          currentLenses = JSON.parse(localStorage.getItem("prevLenses"));
          console.log("resetTraySession | current lenses: count " + currentLenses.lens.length);

          for (var i = 0; i < currentLenses.lens.length; i++) {
            console.log("resetTraySession | targeted lens: " + currentLenses.lens[i])
            localStorage.removeItem(currentLenses.lens[i]);
          }
        }
        else {
          console.log("resetTraySession | no prev lenses found");
        }
        //console.log("resetTraySession | removing lens entry: " + currentLenses[i]);
        //  localStorage.removeItem(currentLenses[i]);
        setCurrentLensCount(0);
        console.log("resetTraySession | removing prevLenses object and related items");
        localStorage.removeItem("prevLenses");
        localStorage.removeItem("nLens");
        localStorage.removeItem("prev_lens");
        localStorage.removeItem("Planogram");
        localStorage.removeItem("trayLabel");
        localStorage.removeItem("trayID");
        localStorage.removeItem("traySession");
        localStorage.removeItem("lensGoal");
        navigate("/FinishingTrayId");
      })
      .catch((error) => console.log(error));
  };


  function DynamicTable({ dynamicTableData }) {

    console.log(dynamicTableData);
    return (
      <table style={{ maxWidth: `${screenWidthPercentage}%`, height: '80vh' }}>
        <thead>
          {tableHeaders}
        </thead>
        <tbody style={{}}>
          {[...dynamicTableData].reverse().map((row, rowIndex) => (

            <tr key={rowIndex}>
              {row.map((cellValue, cellIndex) => (
                <td key={cellIndex} style={{ backgroundColor: getBackgroundColor(cellValue) }}
                >
                  {splitContent(cellValue)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <thead>
          {feTableHeaders}
        </thead>
      </table>

    );

  }

  const dynamicTableData = [];
  const hasData = true; // Update this value as needed

  //const filteredStationData = workOrder.filter((obj) => obj.ws_id === ;
  const stationNumber = parseInt(localStorage.getItem('Station'));
  const filteredStationData = workOrder;

  console.log("Workorder" + JSON.stringify(workOrder));

  console.log("Filtered Station Data:" + JSON.stringify(filteredStationData));

  for (let i = 0; i < maxRows; i++) {
    let row = [];

    for (let j = 0; j < maxHeaderColumns; j++) {

      // Find the object in arrayOfObjectsData that matches the current row and column positions
      //const cellObject = workOrder.find(obj => obj.pos_row === i + 1 && obj.pos_col === j + 1);
      let cellObject = filteredStationData.find(obj => obj.pos_row === i + 1 && obj.pos_col === j + 1);


      // If the object is found, push its lens_desc value into the row; otherwise, push an empty string
      let cellValue = cellObject ? cellObject.lens_desc : '';
      row.push(cellValue);
      //console.log(cellObject);
    }
    //console.log(row)
    // Check if the row contains any actual data
    const hasActualData = row.some(cellValue => cellValue !== '');

    // If there is actual data in the row, push it to dynamicTableData
    if (hasActualData || hasData) {
      dynamicTableData.push(row);
    }
  }

  //console.log(dynamicTableData)

  var screenWidth = window.screen.width;
  var screenHeight = window.screen.height;
  console.log(screenWidth, screenHeight)
  var screenWidthPercentage = (screenWidth / window.screen.width) * 100;
  var screenHeightPercentage = screenHeight
  // var maxHeightPer = (screenHeight / window.screen.height) * 100;
  //console.log(screenHeight-screenHeightPercentage/4.8)


  const tableHeaders = (headerData.slice(0, finalMaxDynamicColCount)).map((header, index) => (
    <th key={`header-${index}`} style={{ width: `1600px` }}>{header}</th>
  ));
  const feTableHeaders = (FE.slice(0, finalMaxDynamicColCount)).map((header, index) => (
    <th key={`header-${index}`} style={{ width: `1600px` }}>{header}</th>
  ));

  //console.log(window.screen.width,window.screen.height,screenWidthPercentage,maxRows)
  return (
    <div style={
      {
        width: screenWidth,
        height: '100vh',

        // background:'yellow'
      }}>

      <div style={{
        width: `${screenWidthPercentage}%`,
        minHeight: '20vh',
        //  screenHeightPercentage/4.8,
        maxHeight: '20vh',
        //  screenHeightPercentage/4.8,
        //  height:screenHeightPercentage/8,
        // background:'red'
      }}>



        <AppBar position="static" id="appbar">
          <Toolbar>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={1}>
                <Typography variant="subtitle2">
                  IKB | 2.0  <IconButton onClick={() => handleClickOpen()}> <HandymanIcon sx={{ color: "White" }} /> </IconButton>
                </Typography>

              </Grid>
              <Grid item xs={12} sm={9}>
                <Box display="flex" justifyContent="space-between" flexWrap="wrap">

                  {<Typography variant="body2">
                    <b>Order ID:</b> {localStorage.getItem("WorkOrder")}
                  </Typography>
                  }
                  <Typography variant="body2">
                    <b>Station:</b> {localStorage.getItem("Station")}
                  </Typography>
                  <Typography variant="body2">
                    <b>Product:</b> {JSON.parse(localStorage.getItem("traySession")).kit_code}
                  </Typography>
                  <Typography variant="body2">
                    <b>Tray Label:</b> {localStorage.getItem("trayLabel")}
                  </Typography>
                  <Typography variant="body2">
                    <b>Tray Number:</b> {localStorage.getItem("trayNumber")}
                  </Typography>
                  <Typography variant="body2">
                    <b>Anterior Lente:</b> {localStorage.getItem("prev_lens")}
                  </Typography>
                  <Typography variant="body2">
                    <b>Lentes ct :</b> {localStorage.getItem("nLens")} / {localStorage.getItem("lensGoal")}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Toolbar>
        </AppBar>
        <div>
          <Dialog
            open={passwordCheckDialogOpen}
            onClose={handlePasswordCheckDialogClose}
            PaperProps={{
              component: 'form',
              onSubmit: (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const formJson = Object.fromEntries((formData).entries());
                const passcode = formJson.passcode;
                var success = clearLocalStorage(passcode);
                if (success) {
                  handlePasswordCheckDialogClose();
                } else {
                  setPasswordCheckDialogError("Incorrect Passcode");
                }

              },
            }}
          >
            <DialogTitle>Confirm Passcode</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                required
                margin="dense"
                id="passcode"
                name="passcode"
                type="password"
                fullWidth
                variant="standard"
                helperText={passwordCheckDialogError}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handlePasswordCheckDialogClose}>Cancel</Button>
              <Button type="submit">submit</Button>
            </DialogActions>
          </Dialog>
        </div>
        <div style={{ marginLeft: '2%' }}>
          <div style={{ display: 'flex' }}>


          </div>
          <div style={{ display: 'flex' }}>
            <div ><TextField id="unparsed-barcode" onChange={(e) => setBarCodeFieldValue(e.target.value)} autoFocus label="Barcode" variant="standard" /></div>
            <div style={{ marginLeft: '10%' }}><TextField id="lot-num" label="Lot Number" variant="standard" /></div>
            <div style={{ marginLeft: '10%' }}><TextField id="expiration-date" label="Expiration Date" variant="standard" /></div>
            <div style={{ marginLeft: '10%' }}><TextField id="upc" label="Lens UPC" variant="standard" onChange={(e) => setUPCValue(e.target.value)} /></div>
            <div style={{ marginLeft: '2%', marginTop: '0.5%' }}>
              <Button variant="contained" onClick={pushScan}>Submit</Button>
              <Button style={{ marginLeft: '2%' }} variant="contained" onClick={clearFieldVals}>Claro</Button>
              <Button style={{ marginTop: '0.5%' }} variant="contained" onClick={resetTraySession}>Save & Exit</Button>
            </div>
          </div>
        </div>
      </div>
      <div id="planogram">
        <div >
          <div style={{ height: '80vh', overflow: 'auto' }}>
            <DynamicTable dynamicTableData={dynamicTableData}
            />
            {/*setRenderComplete(true)*/}
          </div>

        </div>
      </div>
      <div style={{ margin: "25%" }}>

        {/*setTimeout(() => {
       resetCurrentLensCt()
      }, 0)
      */
        }


        <Modal
          open={open}
          // onClose={handleClose}
          aria-labelledby="modal-modal-title"

          aria-describedby="modal-modal-description"
        >
          <Box sx={style}>
            <Button onClick={handleClose} sx={{ position: 'absolute', top: '0px', left: '0px' }}>X</Button>
            <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ textAlign: 'center' }}>
              AUTHORIZE
            </Typography>
            {/* <input
            placeholder="Enter PIN"
            style={{borderStyle:'dashed'}}
          /> */}
            <InputData handleClose={resetTraySession} />
            {/* <TextField
            placeholder="Enter Pin"
            fullWidth
            sx={{
              "& fieldset": { border: 'none' ,borderStyle:'dashed',borderColor:':#8644A2'},
            }}

          />
          <center><Button variant="contained" sx={{marginTop:"20px"}}>Enter</Button></center>  */}
          </Box>
        </Modal>



        <Box>
          {/* <InputData/> */}
        </Box>
      </div>
    </div>
  );
}

export default FinishingStations;
