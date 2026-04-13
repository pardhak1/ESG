
import React, { useEffect, useState, useCallback, useRef } from "react";
import '../wh/wh.scss';
// import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
// import { Box ,Typography,AppBar, IconButton,Toolbar} from "@mui/material";
import { AppBar, Toolbar, Typography, Grid, Box } from '@mui/material';
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import InputData from "../wh/InputData";
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


const KeyenceWh = () => {

  const [lensGoal, setLensGoal] = useState(0);
  const [nLens, setNLens] = useState(0);
  const [prevLenses, setPrevLenses] = useState(null);
  const [planogram, setPlanogram] = useState(null);
  const [prevLens, setPrevLens] = useState(null);
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
  const popupRef = useRef(null);
  const [showNotification, setShowNotification] = useState(false);
  const [isDecrementing, setIsDecrementing] = useState(false);

  const [removedScans, setRemovedScans] = useState(0);
  const [scanSession, setScanSession] = useState(null)
  const [scanedLensesByDesc, setScanedLensesByDesc] = useState(new Map())
  const [isRemoving, setIsRemoving] = useState(false);
  const [operationQueue, setOperationQueue] = useState([]);
  const [currentLensCount, setCurrentLensCount] = useState(() => {
    return nLens;
  });
  const isResettingRef = useRef(false);
  const [passwordCheckDialogOpen, setPasswordCheckDialogOpen] = React.useState(false);
  const [passwordCheckDialogError, setPasswordCheckDialogError] = React.useState("");
  const [errCheckDialogOpen, setErrCheckDialogOpen] = React.useState(false);
  const [errorType, setErrorType] = useState("");


  // currentScanCount 
  // 25
  // isFullyPopulated
  // : 
  // false
  // maxTrayQty
  // : 
  // 62
  useEffect(() => {
   // console.log("USEEFFECT: Inside teh useffect scanSession", scanSession);
    const intermediateFunction = async () => {
      let kitcode = localStorage.getItem("kit_code");
      let station = localStorage.getItem("Station");
      let trayNumber = localStorage.getItem("trayNumber");
      let moddedPlanogram = [];

      await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/getstation/` + kitcode + "/" + station + "/" + trayNumber, {
        method: "GET",
        headers: {
          'Content-Type': 'application/json',
        },

      }).then((response) => response.json())
        .then((data) => {
          // console.log("executing after await")
          //TODO: Check for nulls
          setWorkOrder(data.data);

          if (!planogram) {
            //if (!localStorage.getItem("Planogram")) {
            /*
            moddedPlanogram = data.data.map(item => ({
              ...item,
              Count: 0
            }));
            */
            setPlanogram(data.data)
            // remove
            //localStorage.setItem("Planogram", JSON.stringify(data.data));
            let lensgoalCount = 0;
            for (let i = 0; i < data.data.length; i++) //Map this
            {
              if (data.data[i].lens_upc) {
                //console.log(data.data[i]);
                lensgoalCount++;
              }
            }
            // console.log("Calculated lensgoal " + lensgoalCount);
            setLensGoal(lensgoalCount)
            // remove
            //localStorage.setItem("lensGoal", lensgoal);
          }
          //    console.log("----------------START------------------")
          // let scanSession = localStorage.getItem("scanSession");
          // scanSession = JSON.parse(scanSession);
          populateCacheStorage(data.data);

          // console.log("----------------END------------------")

          // setLoading(false);
          // console.log(data);
          // console.log(workOrder);
        })
        .catch((error) => console.log(error));

    }
    if (scanSession) {
      // if it is fully populated redirect to the other route
      //console.log("USEEFFECT: printing the scansession fullly opulated filed", scanSession?.isFullyPopulated);
      if (scanSession?.isFullyPopulated) {
        // if it is fully populated redirect to the other route
        navigate('/keyence/trayid');
      } else {
        //console.log("USEEFFECT: running the intermediate function")
        intermediateFunction();
      }

    }
    else {
     // console.log("USEEFFECT: scan session is waiting to be set");
       awaitFunction();
    }


  }, [scanSession]);

  const closePopup = () => popupRef.current.close();

  // testing code
  useEffect(() => {
    awaitFunction();
  }, [])

  const awaitFunction = async () => {
      resetCurrentLensCt();
       //console.log("USEEFFECT: awaiting for the tray and populate funciton, willset scanSession here")
      await checkTrayAndPopulateCache();
    }

  useEffect(() => {
    // const storedCount = parseInt(localStorage.getItem("nLens"));
    // const storedGoal = parseInt(localStorage.getItem("lensGoal"));

    const storedCount = nLens;
    const storedGoal = lensGoal;

    if (!isNaN(storedCount)) {
      setCurrentLensCount(storedCount);
    }

    if (!isNaN(storedGoal)) {
      setLensGoal(storedGoal);
    }
  }, []);

  async function checkTrayAndPopulateCache() {

    // console.log("--------------------------START checkTrayAndPopulateCache-------------------------")

    const trayidlabel = localStorage.getItem("trayLabel");
    const ws_id = localStorage.getItem('Station');

    await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/trayid1/${trayidlabel}/${ws_id}`, {
      method: "GET",
      headers: {
        'Content-Type': 'application/json',
      },
    }).then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.success === 1) {
          // remove
          //localStorage.setItem("scanSession", JSON.stringify(data));
          // console.log("SETTING SCAN DATA ::::::::::: + ", JSON.stringify(data))
          const extractedData = (data ? data.data : {});
          setScanSession(extractedData);

          console.log("--------------------------COMPLETED checkTrayAndPopulateCache-------------------------")
        } else {
          setErrorType("TRAY");
          alert(data.message || 'Error fetching tray data');
        }
      }).catch((error) => {
        console.log(error);
        setErrorType("TRAY");
        alert('Error fetching tray data');
      });
  }


  function populateCacheStorage(planogramData) {

    // console.log("------------------ START populateCacheStorage ----------------- ")
    // console.log("scanSession :::::::::::::::::::::::::::: " + JSON.stringify(scanSession))
    //data = scanSession;
    setLensGoal(scanSession.maxTrayQty);
    // remove
    // localStorage.setItem("lensGoal", data.maxTrayQty);


    var lens = scanSession.scanInfo.map((value, index, array) => {
      return value.lens_desc;
    })

    var prevLensesList = {
      lens: lens
    };
    // console.log()
    setNLens(scanSession.currentScanCount);
    setPrevLenses(prevLensesList);
    setPrevLens(lens[lens.length - 1]);
    // console.log("NLens :::::::::::::: " + nLens)
    // console.log("prevLenses :::::::::::::: " + prevLenses)
    // console.log("setPrevLens :::::::::::::: " + lens[lens.length - 1])
    // remove
    //localStorage.setItem("nLens", data.currentScanCount);
    //localStorage.setItem("prevLenses", JSON.stringify(prevLenses));
    //localStorage.setItem("prev_lens", lens[lens.length - 1]);

    // let planogram = localStorage.getItem("Planogram");
    //planogram = JSON.parse(planogram);

    const lens_max_count = new Map()
    planogramData.forEach(item => {
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
    scanSession.scanInfo.forEach((scanned_lens, index) => {

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
          tray_id: scanSession.trayInfo.wo_tray_id,
          lens_exp_date: 0,
          render_state: true //true while scanned_lens_ct <= current_lens_ct; false otherwise
        };
        scanned_lenses.set(scanned_lens["lens_desc"], lens_store)
      }
    });
    // console.log("setting updated scanned lenses using await")
    // console.log(scanned_lenses)
    const valueMap = new Map(scanedLensesByDesc);
    scanned_lenses.forEach((scan_info, lens_desc) => {
      valueMap.set(lens_desc, scan_info)
      //remove
      //localStorage.setItem(lens_desc, JSON.stringify(scan_info));
    });
    setScanedLensesByDesc(valueMap)
    // console.log("------------------ COMPLETED populateCacheStorage ----------------- ")

    // Planogram
    // [{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632830","lens_desc":"TSM1DMFN86-0350HI","pos_col":1,"pos_row":21,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632847","lens_desc":"TSM1DMFN86-0325HI","pos_col":1,"pos_row":20,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632847","lens_desc":"TSM1DMFN86-0325HI","pos_col":1,"pos_row":19,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632854","lens_desc":"TSM1DMFN86-0300HI","pos_col":1,"pos_row":18,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632854","lens_desc":"TSM1DMFN86-0300HI","pos_col":1,"pos_row":17,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334631291","lens_desc":"TSM1DMFN86-0275HI","pos_col":1,"pos_row":16,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334631291","lens_desc":"TSM1DMFN86-0275HI","pos_col":1,"pos_row":15,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633028","lens_desc":"TSM1DMFN86-0250HI","pos_col":1,"pos_row":14,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633028","lens_desc":"TSM1DMFN86-0250HI","pos_col":1,"pos_row":13,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633110","lens_desc":"TSM1DMFN86-0225HI","pos_col":1,"pos_row":12,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633110","lens_desc":"TSM1DMFN86-0225HI","pos_col":1,"pos_row":11,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633127","lens_desc":"TSM1DMFN86-0200HI","pos_col":1,"pos_row":10,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633127","lens_desc":"TSM1DMFN86-0200HI","pos_col":1,"pos_row":9,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633134","lens_desc":"TSM1DMFN86-0175HI","pos_col":1,"pos_row":8,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633141","lens_desc":"TSM1DMFN86-0150HI","pos_col":1,"pos_row":7,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633158","lens_desc":"TSM1DMFN86-0125HI","pos_col":1,"pos_row":6,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633165","lens_desc":"TSM1DMFN86-0100HI","pos_col":1,"pos_row":5,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633172","lens_desc":"TSM1DMFN86-0075HI","pos_col":1,"pos_row":4,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633189","lens_desc":"TSM1DMFN86-0050HI","pos_col":1,"pos_row":3,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633196","lens_desc":"TSM1DMFN86-0025HI","pos_col":1,"pos_row":2,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632861","lens_desc":"TSM1DMFN86-0000HI","pos_col":1,"pos_row":1,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632786","lens_desc":"TSM1DMFN86-0475HI","pos_col":2,"pos_row":10,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632793","lens_desc":"TSM1DMFN86-0450HI","pos_col":2,"pos_row":9,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632793","lens_desc":"TSM1DMFN86-0450HI","pos_col":2,"pos_row":8,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632809","lens_desc":"TSM1DMFN86-0425HI","pos_col":2,"pos_row":7,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632809","lens_desc":"TSM1DMFN86-0425HI","pos_col":2,"pos_row":6,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632816","lens_desc":"TSM1DMFN86-0400HI","pos_col":2,"pos_row":5,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632816","lens_desc":"TSM1DMFN86-0400HI","pos_col":2,"pos_row":4,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632823","lens_desc":"TSM1DMFN86-0375HI","pos_col":2,"pos_row":3,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632823","lens_desc":"TSM1DMFN86-0375HI","pos_col":2,"pos_row":2,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632830","lens_desc":"TSM1DMFN86-0350HI","pos_col":2,"pos_row":1,"ws_id":1,"ws_name":"Station 1","ws_number":1}]

  }

  const getStorageValues = useCallback(() => {
    const storedCount = nLens;
    const storedGoal = lensGoal;
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
    // console.log(`Checking completion: Current count ${nLens}, Goal ${lensGoal}`);

    if (nLens === 0 || lensGoal === 0) {
      // console.log("Count or goal not set yet, skipping completion check");
      return;
    }

    if (nLens === lensGoal && !isResettingRef.current) {
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
  }, []);

  // Initialize state from localStorage
  useEffect(() => {
    setCurrentLensCount(nLens);
    setLensGoal(lensGoal);
  }, []);

  useEffect(() => {
    if (currentLensCount !== null) {
      setNLens(currentLensCount);
      // Remove
      //localStorage.setItem("nLens", currentLensCount.toString());
      if (!isResettingRef.current) {
        checkTrayCompletion();
      }
    }
  }, [currentLensCount, checkTrayCompletion]);

  useEffect(() => {
    if (lensGoal !== null) {
      // Remove
      //localStorage.setItem("lensGoal", lensGoal.toString());
      checkTrayCompletion();
    }
  }, [lensGoal, checkTrayCompletion]);

  const setGoal = useCallback((newGoal) => {
    console.log(`Setting new goal: ${newGoal}`);
    setLensGoal(newGoal);
  }, []);



  const incLens = useCallback(() => {
    const newCount = (nLens || 0) + 1;
    setNLens(newCount)
    // remove
    // localStorage.setItem("nLens", newCount.toString());
    setCurrentLensCount(newCount);
    console.log("Incrementing lens counter to", newCount);
    checkTrayCompletion();
  }, [checkTrayCompletion]);



  useEffect(() => {
    if (currentLensCount !== null) {
      setNLens(currentLensCount)
      // localStorage.setItem("nLens", currentLensCount.toString());
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
    setPrevLens(key);
    // remove
    ///localStorage.setItem("prev_lens", key);
    if (prevLenses) {
      // remove
      //var prevLenses = JSON.parse(localStorage.getItem("prevLenses"));
      var lens = prevLenses[key];

      var exist = prevLenses['lens'].find(element => element == key);

      if (!exist) {
        console.log("Adding new lens entry to prevLenses with value: " + key);
        prevLenses['lens'].push(key);

      }
      else {
        console.log("Lens: " + key + " has been added already")
      }
      setPrevLenses(prevLenses)
      // remove
      //localStorage.setItem("prevLenses", JSON.stringify(prevLenses));
    } else {
      setPrevLenses({ lens: [key] })
      // remove
      //localStorage.setItem("prevLenses", JSON.stringify({ lens: [key] }));
    }

    var lens_store = [];
    if (scanedLensesByDesc.has(key)) {
      //lens_store = JSON.parse(localStorage.getItem(key));
      lens_store = scanedLensesByDesc.get(key)
      console.log("Lens state " + JSON.stringify(lens_store));
      if (lens_store['scanned_lens_ct'] + 1 <= lens_store['max_lens_ct']) {
        lens_store['scanned_lens_ct'] = lens_store['scanned_lens_ct'] + 1;
        lens_store['render_state'] = true;
      } else {
        setErrorType("MAXLENS");
        setErrCheckDialogOpen()
        alert("ManageLenses | Max lens count of: " + key + " already reached!");
        // let maxLens = window.confirm("Max lens count of: " + key + " already reached!","Test");

        //Need a callback or localStorage modification to prevent the insert on submitscan
        //removeScan();
        lens_store['render_state'] = false;
      }

      //lens_store['scanned_lens_ct'] = (lens_store['scanned_lens_ct']) + 1; 
      scanedLensesByDesc.set(key, lens_store);
      setScanedLensesByDesc(scanedLensesByDesc);
      // remove
      //localStorage.setItem(key, JSON.stringify(lens_store));
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

      scanedLensesByDesc.set(key, lens_store);
      setScanedLensesByDesc(scanedLensesByDesc);
      //remove
      //localStorage.setItem(key, JSON.stringify(lens_store));
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
    if (planogram) {
      //if (localStorage.getItem("Planogram")) {
      //let planogram = localStorage.getItem("Planogram");
      //planogram = JSON.parse(planogram);
      let row = 0;
      let col = 0;
      for (var i = 0; i < planogram.length; i++) {

        if (planogram[i].lens_upc === lens_upc) {
          console.log("trackPos | Located a match, need to modify count from here");
          let lens_desc = planogram[i].lens_desc
          var currentLens = scanedLensesByDesc.get(lens_desc)
          //var currentLens = JSON.parse(localStorage.getItem(lens_desc)); // grab a copy  of the lenstore

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
    if (planogram) {
      //if (localStorage.getItem("Planogram")) {
      //let planogram = localStorage.getItem("Planogram");
      //planogram = JSON.parse(planogram);
      let row = 0;
      let col = 0;
      for (var i = 0; i < planogram.length; i++) {

        if (planogram[i].lens_desc === lens) {
          console.log("trackPos | Located a match, need to modify count from here");
          var currentLens = scanedLensesByDesc.get(lens) // grab a copy  of the lenstore
          //var currentLens = JSON.parse(localStorage.getItem(lens)); // grab a copy  of the lenstore

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
  // Ensure the input is exactly 8 digits
  if (!/^(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[1,2]\d|3[0,1])\d{6}$/.test(expiryDateString)) return false;

  const year = parseInt(expiryDateString.slice(0, 4), 10);
  const month = parseInt(expiryDateString.slice(4, 6), 10);
  const day = parseInt(expiryDateString.slice(6, 8), 10);

  // Create a date object
  const expiryDate = new Date(year, month - 1, day);

  // Check if the date object matches the input (catches invalid dates like Feb 30)
  if (
    expiryDate.getFullYear() !== year ||
    expiryDate.getMonth() !== month - 1 ||
    expiryDate.getDate() !== day
  ) {
    return false;
  }

  // Compare against 13 months from today
  const minExpireDate = new Date();
  minExpireDate.setMonth(minExpireDate.getMonth() + 13);
  expiryDate.setHours(0, 0, 0, 0);
  minExpireDate.setHours(0, 0, 0, 0);

  return expiryDate >= minExpireDate;
}


  async function PushScan() {
    const getLocalStorageData = localStorage.getItem('data')


    //INFO: I like to comment out the following check for debugging; so I can just submit a UPC for planogram checking rather than the whole barcode field set

    const upc = document.getElementById("upc").value
    const tray_id = localStorage.getItem("trayID");
    const station = localStorage.getItem("Station");
    const tray_number = localStorage.getItem("trayNumber");
    const kit_code = localStorage.getItem('kit_code');
    const expirationDate = document.getElementById("expiration-date").value;
    const unparsedBarcode = document.getElementById("unparsed-barcode").value;

    if (!document.getElementById("lot-num").value || !upc
      || !document.getElementById("unparsed-barcode").value || !expirationDate) {
      setErrorType("FIELDS");
      setErrCheckDialogOpen(true);
      clearFieldVals();
      return;
    }

    if (!isExpiryDateValid(expirationDate)) {
      setErrorType("EXPIRED");
      setErrCheckDialogOpen(true);
      clearFieldVals();
      return;
    }
    var payload = {
      lotnum: document.getElementById("lot-num").value,
      upc: upc,
      unparsed: document.getElementById("unparsed-barcode").value,
      expir: document.getElementById("expiration-date").value,
      kitcode: kit_code,
      trayID: tray_id,
      traynumber: tray_number,
      station: station,
      upcVerify: (unparsedBarcode.substring(0,2) === '17') || (unparsedBarcode.substring(0,2) === '01' && unparsedBarcode.includes(upc))
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

    console.log(payload)

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
        if (data['success'] == -1) {
          setErrorType("ERROR");
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
        //  console.log("USEEFFECT: setting the scan session variable as null, and trigger useeffect", scanSession);
          setScanSession(null)
        }
        else if (data['success'] == -2) {
          //alert("Invalid Scan");
          setErrorType("MAXLENS");
          setErrCheckDialogOpen()
          clearFieldVals();
        }
        else {
          setErrorType("ERROR");
          console.log("Malformed response");
          setErrCheckDialogOpen()
          clearFieldVals();
        }
      }).catch((error) => {
        clearFieldVals();
        // here if it is an error write a popup

        // this is the first type of popup
        popupRef.current.showModal();
        //alert("Provided data is invalid!");
        console.log(error)
      })

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
    document.getElementById("lot-num").focus();
  }
  function incrementLensCount(value) {
    console.log("incrementLensCt");
    if (scanedLensesByDesc.has(value)) {
      //let lens_store = JSON.parse(localStorage.getItem(value));
      let lens_store = scanedLensesByDesc.get(value);
      console.log("Incrementing lens count for: " + value);
      lens_store['current_lens_ct'] = lens_store['current_lens_ct'] + 1;
      scanedLensesByDesc.set(value, lens_store)
      setScanedLensesByDesc(scanedLensesByDesc)
      // remove
      //localStorage.setItem(value, JSON.stringify(lens_store));
      return true;
    }
    else {
      console.log("Increment failed, provided " + value + " lens has not been scanned");
      return false;

    }
  }

  function changeRenderState(value) {
    console.log("changeRenderState");
    if (scanedLensesByDesc.has(value)) {
      // let lens_store = JSON.parse(localStorage.getItem(value));
      let lens_store = scanedLensesByDesc.get(value);
      lens_store['render_state'] = !(lens_store['render_state']);

      scanedLensesByDesc.set(value, lens_store)
      setScanedLensesByDesc(scanedLensesByDesc)
      //localStorage.setItem(value, JSON.stringify(lens_store));
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
    if (scanedLensesByDesc.has(value)) {
      var lens_store = scanedLensesByDesc.get(value)
      //lens_store = JSON.parse(lens_store);
      // render_state = lens_store['render_state'];
      // console.log("Lens store for: " + value + " | " + JSON.stringify(lens_store));
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


    let val = prevLens

    if (prevLenses) {
      incLens();
    }
    else {
      console.log("resetCurrentLensCt entry | array does not exist");
      return;
    }



    prevLenses['lens'].forEach(val => {

      if (scanedLensesByDesc.has(val)) {
        console.log("resetCurrentLensCt | Drawing complete, resetting current_lens_ct for lens: " + val);
        let lens_store = scanedLensesByDesc.get(val);
        // console.log("printing the lens_store", lens_store);
        // console.log("printing the lens_store in json format", JSON.stringify(lens_store))
        // lens_store = JSON.parse(lens_store);
        lens_store['current_lens_ct'] = 0;
        lens_store['render_state'] = true;
        //lens_store['scanned_lens_ct'] = lens_store['scanned_lens_ct'] + 1; 
        scanedLensesByDesc.set(val, lens_store)
        setScanedLensesByDesc(scanedLensesByDesc)
        //localStorage.setItem(val, JSON.stringify(lens_store))
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
    // if (localStorage.getItem("prevLenses")) //Could make this more robust by storing the vital things (station #, WO_ID, etc) in session storage; then just completely clearing localStorage
    if (prevLenses) {

      currentLenses = prevLenses;
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
    navigate("/keyence/trayid");
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
        if (prevLenses) //Could make this more robust by storing the vital things (station #, WO_ID, etc) in session storage; then just completely clearing localStorage
        {
          // currentLenses = JSON.parse(localStorage.getItem("prevLenses"));
          currentLenses = prevLenses;
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
        navigate("/keyence/trayid");
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

  // console.log("Workorder" + JSON.stringify(workOrder));

  // console.log("Filtered Station Data:" + JSON.stringify(filteredStationData));

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
function soundSequence(frequencies) {
  let audioCtx = new AudioContext();
  let channels = 2;
  let duration = 0.13; // seconds per sound
  const frameCount = audioCtx.sampleRate * duration;

  frequencies.forEach((frequency, index) => {
    const buffer = new AudioBuffer({
      numberOfChannels: channels,
      length: frameCount,
      sampleRate: audioCtx.sampleRate
    });

    for (let channel = 0; channel < channels; channel++) {
      const nowBuffering = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        nowBuffering[i] = 2 * (i * frequency / buffer.sampleRate % 1) - 1; // sawtooth wave
      }
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);

    // Schedule the sound to start later based on index
    source.start(audioCtx.currentTime + index * duration);
  });
}

function errorBlur(e) {
  const value = e.target.value.toUpperCase();
  if (value.includes("ERROR")) {
    setErrorType("ERROR");
    setErrCheckDialogOpen(true);
    soundSequence([300, 400, 523].reverse());
    clearFieldVals();
  } else if (value.includes("EXPIRED")) {
    setErrorType("EXPIRED");
    setErrCheckDialogOpen(true);
    soundSequence([300, 400, 523].reverse());
    clearFieldVals();
  }
}

const handleDialogClose = (event, reason) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown" || reason ==="tabKeyDown") {
      // Play warning sound(s) and keep dialog open
      soundSequence([300, 400, 523].reverse());
      return;
    }

    // If onClose was called without a "reason" (rare) but came from a mouse click event,
    // behave like the acknowledge button:
    if (event && event.detail !== 0) {
      setErrCheckDialogOpen(false);
      window.location.reload();
    }
  };

const handleAcknowledge = (e) => {
  // Only close if the event was triggered by a mouse click
  if (e.detail !== 0) {
    setErrCheckDialogOpen(false);
    window.location.reload()
  }
};
  
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
                    <b>Anterior Lente:</b> {prevLens}
                  </Typography>
                  <Typography variant="body2">
                    <b>Lentes ct :</b> {nLens} / {lensGoal}
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
          <Dialog 
            open={errCheckDialogOpen} 
            onClose={handleDialogClose}>
            {errorType === "EXPIRED" ? (
              <>
              <DialogTitle>Expired date scanned, please alert supervisor</DialogTitle>
              <DialogTitle>Fecha expirada escaneada, por favor avise al supervisor</DialogTitle>
              </>
              ) : errorType === "MAXLENS" ? (
              <>
              <DialogTitle>Max Lens Count Reached</DialogTitle>
              <DialogTitle>Has alcanzado el límite de lentes</DialogTitle>
              </>
              ) : errorType === "FIELDS" ? (
              <>
              <DialogTitle>Please Fill In All Fields</DialogTitle>
              <DialogTitle>Por favor, complete todos los campos</DialogTitle>
              </>
              ) : (
              <>
              <DialogTitle>Error in Scan, Please Acknowledge</DialogTitle>
              <DialogTitle>Error en el escaneo. Por favor confirme</DialogTitle>
              </>
            )}
            <DialogActions>
              <Button
                 onKeyDown= {(e) => {
                  if (e.key === 'Tab') {
                    soundSequence([300, 400, 523].reverse())
                }
              }}
                fullWidth
                margin="dense" 
                onClick={handleAcknowledge}>Acknowledge / Confirmar</Button>
            </DialogActions>
          </Dialog>
        </div>
        <div style={{ marginLeft: '2%' }}>
          <div style={{ display: 'flex' }}>


          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "10px" }}>
            <TextField id="lot-num" autoFocus label="Lot Number" variant="outlined" fullWidth size="medium" onBlur={errorBlur} />
            <TextField id="upc" label="Lens UPC" variant="outlined" fullWidth size="medium" onBlur={errorBlur} />
            <TextField id="unparsed-barcode" label="Unparsed Barcode" variant="outlined" fullWidth size="medium" onBlur={errorBlur} />
            <TextField id="expiration-date" label="Expiration Date" variant="outlined" fullWidth size="medium" onBlur={errorBlur}/>
            <div>
              <Button variant="contained" fullWidth size="large" sx={{ py: 1.2, fontSize: "1.1rem", mb: 1 }} onClick={PushScan}>Scan / Register</Button>
              <Button fullWidth size="large" sx={{ py: 1.2, fontSize: "1.1rem", mb: 1 }} variant="contained" onClick={clearFieldVals}>Clear</Button>
              <Button fullWidth size="large" sx={{ py: 1.2, fontSize: "1.1rem" }} variant="contained" onClick={resetTraySession}>Save & Exit</Button>
            </div>
          </div>
        </div>
      </div>
      <div id="planogram">
        <Typography sx={{ px: 2, py: 1, fontSize: "1rem", fontWeight: 600 }}>Red = not scanned | Green = scanned</Typography>
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

        <dialog ref={popupRef} style={{
          padding: '20px',
          border: 'none',
          borderRadius: '10px',
          width: '300px',
          textAlign: 'center',
          boxShadow: '0 0 20px rgba(0,0,0,0.3)',
          backgroundColor: '#fefefe'

        }}>
          <p style={{ marginBottom: '10px' }}>Provided details are invalid! Please Try again.</p>
          <button onClick={closePopup} style={{
            marginTop: '20px',
            color: 'white',
            padding: '8px 16px',
            backgroundColor: '#007bff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>Close</button>
        </dialog>


        <Box>
          {/* <InputData/> */}
        </Box>
      </div>
    </div>
  );
}

export default KeyenceWh;
