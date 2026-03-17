import React, { useEffect, useRef, useState } from 'react'
import { AppBar, Toolbar, Grid } from '@mui/material';

import { useNavigate } from 'react-router-dom';
import Box from "@mui/material/Box";
import HandymanIcon from '@mui/icons-material/Handyman';
import { IconButton } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import InputData from "./InputData";
import { TextField } from '@mui/material';
import { useLocation } from 'react-router-dom';


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



const FinishingTrayId = () => {

  const navigate = useNavigate();
  const handleClose = () => setOpen(false);
  const [passwordCheckDialogOpen, setPasswordCheckDialogOpen] = React.useState(false);
  const [passwordCheckDialogError, setPasswordCheckDialogError] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [clearStorgePromptVisble, setClearStorgePromptVisble] = React.useState(false);
  const [workOrder, setWorkOrder] = useState([])
  const [password, setPassword] = useState([])
  const [trayId, setTrayId] = useState(false)
  const submitButtonRef = useRef(null);
  const [station, setStation] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // Function to get station from URL parameters
    const getStationFromURL = () => {
      const params = new URLSearchParams(location.search);
      return params.get('station');
    };

    // Try to get station from localStorage first
    let storedStation = localStorage.getItem('Station');
    console.log("localStorage Station:", storedStation);

    // If not in localStorage, try to get from URL
    if (!storedStation) {
      storedStation = getStationFromURL();
      console.log("URL Station:", storedStation);

      // If found in URL, store it in localStorage
      if (storedStation) {
        localStorage.setItem('Station', storedStation);
      }
    }

    if (storedStation) {
      setStation(storedStation);
    } else {
      // If station is not found in either place, redirect back to Workstation
      console.log("Station not found, redirecting...");
      navigate('/Workstation');
    }
  }, [navigate, location]);


  useEffect(() => {
    console.log("Trayid mounted");
    console.log("localStorage Station:", localStorage.getItem('Station'));
    console.log("sessionStorage Station:", sessionStorage.getItem('Station'));
    console.log("Router state:", location.state);
  }, []);


  if (station === null) {
    return <h1>Loading...</h1>;
  }

  function populateCacheStorage(data) {

    localStorage.setItem("traySession", JSON.stringify(data.trayInfo));
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


    // TSM1DMFN86-0275HI 
    //  {"max_lens_ct":2,"scanned_lens_ct":1,"current_lens_ct":1,"tray_id":0,"lens_exp_date":0,"render_state":false}
    //  {"max_lens_ct":2,"scanned_lens_ct":2,"current_lens_ct":2,"tray_id":0,"lens_exp_date":0,"render_state":true} 
    const scanned_lenses = new Map();
    data.scanInfo.forEach((scanned_lens, index) => {

      if (scanned_lenses.has(scanned_lens["lens_desc"])) {
        var lens_store = scanned_lenses.get(scanned_lens["lens_desc"])
        lens_store.max_lens_ct = lens_store.max_lens_ct + 1;
        lens_store.scanned_lens_ct = lens_store.max_lens_ct + 1;
        lens_store.current_lens_ct = lens_store.current_lens_ct + 1;
        scanned_lenses.set(scanned_lens["lens_desc"], lens_store)
      } else {
        var lens_store = {
          max_lens_ct: 1,
          scanned_lens_ct: 1, //finalized scanned lenses
          current_lens_ct: 1, //lenses rendered in current scene
          tray_id: data.trayInfo.wo_tray_id,
          lens_exp_date: 0,
          render_state: false, //true while scanned_lens_ct <= current_lens_ct; false otherwise
        };
        scanned_lenses.set(scanned_lens["lens_desc"], lens_store)
      }
    });

    scanned_lenses.forEach((scan_info, lens_desc) => {
      localStorage.setItem(lens_desc, JSON.stringify(scan_info));
    });

    // Planogram
    // [{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632830","lens_desc":"TSM1DMFN86-0350HI","pos_col":1,"pos_row":21,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632847","lens_desc":"TSM1DMFN86-0325HI","pos_col":1,"pos_row":20,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632847","lens_desc":"TSM1DMFN86-0325HI","pos_col":1,"pos_row":19,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632854","lens_desc":"TSM1DMFN86-0300HI","pos_col":1,"pos_row":18,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632854","lens_desc":"TSM1DMFN86-0300HI","pos_col":1,"pos_row":17,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334631291","lens_desc":"TSM1DMFN86-0275HI","pos_col":1,"pos_row":16,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334631291","lens_desc":"TSM1DMFN86-0275HI","pos_col":1,"pos_row":15,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633028","lens_desc":"TSM1DMFN86-0250HI","pos_col":1,"pos_row":14,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633028","lens_desc":"TSM1DMFN86-0250HI","pos_col":1,"pos_row":13,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633110","lens_desc":"TSM1DMFN86-0225HI","pos_col":1,"pos_row":12,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633110","lens_desc":"TSM1DMFN86-0225HI","pos_col":1,"pos_row":11,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633127","lens_desc":"TSM1DMFN86-0200HI","pos_col":1,"pos_row":10,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633127","lens_desc":"TSM1DMFN86-0200HI","pos_col":1,"pos_row":9,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633134","lens_desc":"TSM1DMFN86-0175HI","pos_col":1,"pos_row":8,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633141","lens_desc":"TSM1DMFN86-0150HI","pos_col":1,"pos_row":7,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633158","lens_desc":"TSM1DMFN86-0125HI","pos_col":1,"pos_row":6,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633165","lens_desc":"TSM1DMFN86-0100HI","pos_col":1,"pos_row":5,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633172","lens_desc":"TSM1DMFN86-0075HI","pos_col":1,"pos_row":4,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633189","lens_desc":"TSM1DMFN86-0050HI","pos_col":1,"pos_row":3,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334633196","lens_desc":"TSM1DMFN86-0025HI","pos_col":1,"pos_row":2,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632861","lens_desc":"TSM1DMFN86-0000HI","pos_col":1,"pos_row":1,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632786","lens_desc":"TSM1DMFN86-0475HI","pos_col":2,"pos_row":10,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632793","lens_desc":"TSM1DMFN86-0450HI","pos_col":2,"pos_row":9,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632793","lens_desc":"TSM1DMFN86-0450HI","pos_col":2,"pos_row":8,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632809","lens_desc":"TSM1DMFN86-0425HI","pos_col":2,"pos_row":7,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632809","lens_desc":"TSM1DMFN86-0425HI","pos_col":2,"pos_row":6,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632816","lens_desc":"TSM1DMFN86-0400HI","pos_col":2,"pos_row":5,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632816","lens_desc":"TSM1DMFN86-0400HI","pos_col":2,"pos_row":4,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632823","lens_desc":"TSM1DMFN86-0375HI","pos_col":2,"pos_row":3,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632823","lens_desc":"TSM1DMFN86-0375HI","pos_col":2,"pos_row":2,"ws_id":1,"ws_name":"Station 1","ws_number":1},{"kit_id":9,"kit_code":"GC1DMF2430","kit_desc":"CLARITI MULTI-FOCAL 2430 4D IK","kit_upc":"196334802516","tray_id":15,"tray_kit_code":"C1DMF2430-UPC-T4","tray_number":4,"lens_upc":"196334632830","lens_desc":"TSM1DMFN86-0350HI","pos_col":2,"pos_row":1,"ws_id":1,"ws_name":"Station 1","ws_number":1}]

  }

  function fscheckTrayID() {
    let trayidlabel = document.getElementById("traylabel").value;
    let ws_id = localStorage.getItem('Station'); // Assuming station ID is stored in localStorage

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
          fsSubmitTrayLabel(data.data);
        } else {
          alert(data.message || 'Error fetching tray data');
          clearField();
        }
      })
      .catch((error) => {
        console.log(error);
        alert('Error fetching tray data');
        clearField();
      });
  }

  function parseTray(str) {
    //take our standard traylabel format and pull out a traynumber int
    const match = str.match(/T(\d+)/);
    return match ? match[1] : null;

  }
  function clearField() {
    document.getElementById("traylabel").value = "";
    document.getElementById("traylabel").focus();
  }


  function fsSubmitTrayLabel(data) {
    console.log("submitTrayLabel param | " + JSON.stringify(data));

    if (data.trayInfo) {
      if (data.trayInfo.wo_id == localStorage.getItem("workorder_id")) {
        localStorage.setItem("traySession", JSON.stringify(data.trayInfo));
        localStorage.setItem("trayID", data.trayInfo.wo_tray_id);
        localStorage.setItem("trayLabel", data.trayInfo.wo_traylabel);
        localStorage.setItem("trayNumber", parseTray(data.trayInfo.wo_traylabel));
        localStorage.setItem("maxTrayQty", data.maxTrayQty);
        localStorage.setItem("currentScanCount", data.currentScanCount);

        if (data.isFullyPopulated) {
          alert(`${data.message} (${data.currentScanCount}/${data.maxTrayQty})`);
          // You might want to handle this case differently, e.g., prevent navigation or show a warning
          clearField();
          return;
        }
        else if (data.currentScanCount == 0) {
          navigate("/finishingstations");
        }
        else {
          //populateCacheStorage(data)
          localStorage.setItem("scanSession", JSON.stringify(data));
          navigate("/finishingstations");
          // alert(`Tray ${localStorage.getItem("trayLabel")} is already in progress for Station: ${localStorage.getItem("Station")} with count of ${data.currentScanCount}/${data.maxTrayQty}.`);
          // clearField();
          // return;
        }
      } else {
        alert("This tray is for a different workorder!");
        clearField();
      }
    }
    else {
      alert('Invalid Scan');
      clearField();
    }
  }

  function submitTrayLabel(data) {
    console.log("submitTrayLabel param | " + JSON.stringify(data));

    if (data.trayInfo) {
      if (data.trayInfo.complete_date === '') {
        if (data.trayInfo.wo_id == localStorage.getItem("workorder_id")) {
          localStorage.setItem("traySession", JSON.stringify(data.trayInfo));
          localStorage.setItem("trayID", data.trayInfo.wo_tray_id);
          localStorage.setItem("trayLabel", data.trayInfo.wo_traylabel);
          localStorage.setItem("trayNumber", parseTray(data.trayInfo.wo_traylabel));
          localStorage.setItem("maxTrayQty", data.maxTrayQty);
          localStorage.setItem("currentScanCount", data.currentScanCount);

          if (data.isFullyPopulated) {
            alert(`${data.message} (${data.currentScanCount}/${data.maxTrayQty})`);
            // You might want to handle this case differently, e.g., prevent navigation or show a warning
            clearField();
            return;
          }
          else if (data.currentScanCount == 0) {
            navigate("/wh");

          }
          else {
            //populateCacheStorage(data)
            localStorage.setItem("scanSession", JSON.stringify(data));
            navigate("/wh");
            // alert(`Tray ${localStorage.getItem("trayLabel")} is already in progress for Station: ${localStorage.getItem("Station")} with count of ${data.currentScanCount}/${data.maxTrayQty}.`);
            // clearField();
            // return;

          }

        } else {
          alert("This tray is for a different workorder!");
          clearField();
        }
      } else {
        alert('Completed Tray');
        clearField();
      }
    } else {
      alert('Invalid Scan');
      clearField();
    }
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      fscheckTrayID();
    }
  };



  const handleClickOpen = () => {
    setPasswordCheckDialogError("");
    setPasswordCheckDialogOpen(true);
  };

  const handlePasswordCheckDialogClose = () => {
    setPasswordCheckDialogOpen(false);
  };

  function clearLocalStorage(passcode) {
    //clear local storage and return to activeOrder Page

    var success = false;
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
        success = true
        localStorage.clear();
        navigate("/activeorders");
      })
      .catch((error) => console.log(error));

    return success;

  }




  return (
    <>
      <AppBar position="static" id="appbar">
        <Toolbar>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={1}>
              <Typography variant="subtitle2">
                IKB | 2.0  <IconButton onClick={handleClickOpen}> <HandymanIcon sx={{ color: "White" }} /> </IconButton>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Box display="flex" justifyContent="space-between" flexWrap="wrap">
                <Typography variant="body2">
                  <b>Order ID:</b> {localStorage.getItem("WorkOrder")}
                </Typography>
                <Typography variant="body2">
                  <b>Station:</b> {localStorage.getItem("Station")}
                </Typography>
                <Typography variant="body2">
                  <b>Product:</b> {(localStorage.getItem("kit_code"))}
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
      <div
        style={{
          fontSize: "40px",
          fontWeight: "bolder",
          textAlign: "center"
        }}>

        {`Scan Tray Label`}

        <div>
          {/* Input text box */}

          <TextField
            type='text'
            id='traylabel'
            autoFocus
            placeholder="Enter Tray Label"
            onKeyDown={handleKeyPress}

          />
          <div>
            <Button variant="contained" color="primary"
              onClick={fscheckTrayID}
              id="fs-button"
              type="submit"
            >Finishing Station</Button>
          </div>
        </div>

        {/* {filteredTrayIdData.map((e,index) => {
      return <p key={index}
      style={{
        fontSize:'20px'
      }}
      >{e.wo_traylabel}</p>
    })} */}
      </div>
      <Modal
        open={open}
        // onClose={handleClose}
        aria-labelledby="modal-modal-title"

        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Button onClick={handleClose} sx={{ position: 'absolute', top: '0px', left: '0px' }}>X</Button>
          <Typography id="modal-modal-title" variant="h6" component="h2" sx={{ textAlign: 'center' }}>
            {`Are you sure you want to submit?`}
          </Typography>
          {/* <input
            placeholder="Enter PIN"
            style={{borderStyle:'dashed'}}
          /> */}
          {/* <InputData handleClose={handleClose}/>  */}
          <Button onClick={() => navigate("/wh")}>ok</Button>
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
    </>
  )
}

export default FinishingTrayId