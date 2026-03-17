import React, { useEffect, useState, useRef, useCallback, } from 'react';
import Avatar from '@mui/material/Avatar';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Container from '@mui/material/Container';
import { AppBar, Toolbar, Typography, Grid, Box, Button, IconButton } from '@mui/material';
import HandymanIcon from '@mui/icons-material/Handyman';
import logo from './../Images/esglogo.png';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';
import { Fireworks } from 'fireworks-js'
import InstantMessage from '../InstantMessage';




export default function Mobile() {


  const [error, setError] = useState(null);
  const [printerFielderror, setPrinterFielderror] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeCabinet, setActiveCabinet] = useState(null);
  const [activeTrays, setActiveTrays] = useState([]);
  const [cabinetSubmitted, setCabinetSubmitted] = useState(false);
  const [submittedTrays, setSubmittedTrays] = useState([]);
  const [maxTrayCount, setMaxTrayCount] = useState(0);
  const currentTrayCountRef = useRef(0);
  const [CompleteKit, setCompleteKit] = useState(false);
  const [Message, setMessage] = useState('') //Controls Message

  const Navigate = useNavigate();

  const isValidPrinterName = async () => {
    console.log("Validate Printern Name Entry");

    let printerName = document.getElementById("printerName").value;
    console.log("Provided Printer Name: " + printerName)
    let isValidPrinterName = false;

    await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/printers/${printerName}`, {
      method: "GET",
    })
      .then((response) => {
        if (response.ok) {
          return response.json();

        } else if (response.status === 400) {
          setPrinterFielderror("Provided Printer is not configured");
          console.log("Provided Printer is not configured. Value " + printerName)
          return false
        }
        throw new Error('Failed to fetch printer');
      })
      .then((data) => {
        console.log("API response:", JSON.stringify(data));
        if (data.success === 1) {
          localStorage.setItem("mobileStationPrinterIP", data.data.cfg_ipaddress);
          localStorage.setItem("mobileStationPrinterPort", data.data.cfg_port);
          localStorage.setItem("mobileStationPrinterName", printerName);
          setPrinterFielderror(null);
          isValidPrinterName = true
        } else {
          setPrinterFielderror("Provided Printer is not configured ", printerName);
          console.log("Provided Printer is not configured. Value " + printerName)
          return
        }

      })
      .catch((error) => {
        console.error('Fetch error:', error);
        setError(error.message);
      });

    return isValidPrinterName;
  }

  const handleSubmit = async (e) => {
    console.log("Handle Submit Entry Point");
    e.preventDefault();
    if (!cabinetSubmitted) {

      if (! await isValidPrinterName()) {
        setCabinetSubmitted(false);
      } else if (await ValidateCabinet()) {
        if (await ValidateCabinetIsAlreadyScanned()) {
          setCabinetSubmitted(false);
        } else {
          const maxCount = JSON.parse(localStorage.getItem("trayGoal"))['trayGoal'];
          console.log("Max Count " + (maxCount));
          setMaxTrayCount(maxCount);
          localStorage.setItem("MaxTrayCount", maxCount.toString());
          // Clear the input field
          document.getElementById("submission").value = '';
          console.log("Clearing Trays");
          setSubmittedTrays([]);
          localStorage.removeItem("SubmittedTrays");
          setCabinetSubmitted(true);
        }

      } else {
        setCabinetSubmitted(false);
      }
    } else {
      validateTray();
    }
  };

  useEffect(() => {

    const cabinetSession = localStorage.getItem("CabinetSession");
    if (cabinetSession) {
      try {
        const parsedSession = JSON.parse(cabinetSession);
        setActiveCabinet(parsedSession);
      } catch (error) {
        console.error("Error parsing CabinetSession:", error);
      }
    }

    const storedTrays = localStorage.getItem("SubmittedTrays");
    if (storedTrays) {
      try {
        const parsedTrays = JSON.parse(storedTrays);
        setSubmittedTrays(parsedTrays);
      } catch (error) {
        console.error("Error parsing SubmittedTrays:", error);
      }
    }
    const maxCount = localStorage.getItem("MaxTrayCount");
    if (maxCount) {
      setMaxTrayCount(parseInt(maxCount, 10));
    }

    getKitInfo();



  }, []);












  const [submitScan, setSubmitScan] = useState("")
  const [woTryId, setWoTryId] = useState([])
  // useEffect(() =>{
  // getcabinetlabel()
  // },[])


  function kitCompletionStatus(val) {

    /*
    val kitDesc = {
      kitname: "",
      kit
    }
    */

  }

  function startFw() {
    const fw_container = document.getElementById('appbar');
    const fireworks = new Fireworks(fw_container, {
      autoresize: true, opacity: 0.5,
      acceleration: 1.05,
      friction: 0.97,
      gravity: 1.5,
      particles: 100,
      traceLength: 3,
      traceSpeed: 10,
      explosion: 5
    });
    fireworks.start()
  }


  function showCompleteBanner() {




  }

  function getKitInfo() {

    let kitInfo = { "trayGoal": 0, "trayIDs": [] };
    console.log("Get Kit Info Entry Point");
    let kitcode = localStorage.getItem("kit_code");
    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/getKitInfo/${localStorage.getItem("kit_code")}`, {
      method: "GET",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to reach getKitInfo endpoint');
        }
        return response.json();
      })
      .then((data) => {
        console.log("API response:", JSON.stringify(data));
        console.log("Tray Count?: " + data.data[0]['tray_count'])
        kitInfo['trayGoal'] = data.data[0]['tray_count'];

        console.log("Fetched tray desc: " + Object.keys(data.data));
        kitInfo['trayIDs'] = data.data['tray_count'];
        console.log("kit info obj: " + JSON.stringify(kitInfo));
        localStorage.setItem("trayGoal", JSON.stringify(kitInfo));
        localStorage.setItem("ItemDescription", data.data[0]['kit_desc']);
        localStorage.setItem("kit_upc", data.data[0]['kit_upc']);
      })
      .catch((error) => {
        console.error('Fetch error:', error);
        setError(error.message);
      });

  }

  async function getFinishedCabinet() {
    console.log("Get Finished Cabinet Entry Point");
    let cabinetLabel = JSON.parse(localStorage.getItem("CabinetSession"))[0]['wo_cabinetlabel'];
    let kitcode = localStorage.getItem("kit_code");
    let wo_id = localStorage.getItem("workorder_id");

    if (!wo_id || !cabinetLabel) {
      alert("Improper State, returning")
      return;
    }
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/getCompleteCabinet/${cabinetLabel}/${wo_id}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error('Failed to reach getCompleteCabinet endpoint');
      }

      const data = await response.json();
      console.log("API response:", JSON.stringify(data));
      console.log("Fetched Cabinet Keys: " + Object.keys(data));

      localStorage.setItem("expiry_date", data.data[0]['exp_date']);
      localStorage.setItem("build_date", data.data[0]['kit_scandate']);

      printCarton();

      return data; // Return the data if needed elsewhere
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message);
      throw error; // Re-throw the error if you want to handle it in the calling function
    }
  }

  async function resetToCabinetSelection() {
    console.log("Resetting cabinet");
    setTimeout(() => {
      showCompleteBanner();
    }, 4500)
    setActiveCabinet(null);
    setCabinetSubmitted(false);
    setSubmittedTrays([]);
    localStorage.removeItem("CabinetSession");
    localStorage.removeItem("SubmittedTrays");
    localStorage.removeItem("expiry_date");
    localStorage.removeItem("build_date");
    Navigate("/mobile");



    console.log("Reset completed");
  }

  async function executeInOrder() {
    try {
      console.log("Starting sequence...");

      await new Promise(resolve => setTimeout(resolve, 5000));
      await getFinishedCabinet();
      console.log("getFinishedCabinet completed");

      //await new Promise(resolve => setTimeout(resolve, 5000));
      setCompleteKit(true);
      await resetToCabinetSelection();
      console.log("resetToCabinetSelection completed");


      console.log("Sequence completed");
    } catch (error) {
      console.error("An error occurred:", error);
    }
  }

  // Call the function to start the sequence

  function formatDate(dateString) {
    // Extract year, month, and day from the string
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);

    // Combine them in the desired format
    return `${year}-${month}-${day}`;
  }



  const handleMaxTrayReached = () => {
    console.log("Max tray, building kit");
    try {
      const response = fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/pushKit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cabinetId: activeCabinet[0].wo_cabinet_id,
          trays: JSON.parse(localStorage.getItem("SubmittedTrays")),
          workOrderId: localStorage.getItem("workorder_id"),
          cabinetlabel: JSON.parse(localStorage.getItem("CabinetSession"))[0]['wo_cabinetlabel']
        })
      });

      /*
      console.log("Handle Max Tray response: " + JSON.stringify(response));
      if (!response.ok) {
        
        throw new Error('Failed to send max tray reached notification');
      }
      */
      // If successful, reset to cabinet selection
      executeInOrder();

    } catch (error) {
      console.error("Error sending max tray notification:", error);
      setError(error.message);
    }
  };

  async function ValidateCabinetIsAlreadyScanned() {
    console.log("ValidateCabinetIsAlreadyScanned");
    var cabinetIsAlreadyScanned = false
    let cabinet_label = document.getElementById("submission").value;
    await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/checkCabinetAlreadyScanned/${cabinet_label}`, {
      method: "POST",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to reach checkCabinetAlreadyScanned endpoint');
        }
        return response.json();
      })
      .then((data) => {
        console.log("API response:", JSON.stringify(data));
        if (data.success === 0) {
          console.error('Invalid Cabinet Label');
          setError('Invalid Cabinet Label, ' + data.message);
          cabinetIsAlreadyScanned = true;
        } else {
          setError(null)
        }
      })
      .catch((error) => {
        console.error('Fetch error:', error);
        setError(error.message);
      });

    return cabinetIsAlreadyScanned;
  };


  function CircularIndeterminate() {
    return (
      <Box sx={{ display: 'flex' }}>
        <CircularProgress />
      </Box>
    );
  }



  async function ValidateCabinet() {
    console.log("ValidateCabinet");

    let validateCabinet = false;
    let cabinet_label = document.getElementById("submission").value;
    await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/checkcabinet/${localStorage.getItem("workorder_id")}/${cabinet_label}`, {
      method: "POST",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to reach checkcabinet endpoint');
        }
        return response.json();
      })
      .then((data) => {
        console.log("API response:", JSON.stringify(data));
        if (data.success === 1) {
          setActiveCabinet(data.data);
          localStorage.setItem("CabinetSession", JSON.stringify(data.data));

          validateCabinet = true;
        } else {
          console.error('Invalid Cabinet Label');
          setError('Invalid Cabinet Label, ' + data.message);
        }

        setActiveCabinet(data.data);
        localStorage.setItem("CabinetSession", JSON.stringify(data.data));
        const maxCount = JSON.parse(localStorage.getItem("trayGoal"))['trayGoal'];


      })
      .catch((error) => {
        console.error('Fetch error:', error);
        setError(error.message);
      });
    return validateCabinet;
  }

  function printCarton() {
    const carton_obj = {
      "kit_code": localStorage.getItem("kit_code"),
      "item_desc": localStorage.getItem("ItemDescription"),
      "cabinet_label": JSON.parse(localStorage.getItem("CabinetSession"))[0]['wo_cabinetlabel'],
      "expiry_date": formatDate(localStorage.getItem("expiry_date")),
      "build_date": formatDate(localStorage.getItem("build_date")),
      "kit_upc": localStorage.getItem("kit_upc"),
      "printer_ip": localStorage.getItem("mobileStationPrinterIP"),
      "printer_port": localStorage.getItem("mobileStationPrinterPort")

    };


    console.log("MobileStation CARTON Print Entry Point");
    console.log("Carton Obj: " + JSON.stringify(carton_obj));
    //debugger;

    try {
      const response = fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/print_carton`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(carton_obj)
      });

      /*
      console.log("Handle Max Tray response: " + JSON.stringify(response));
      if (!response.ok) {
        
        throw new Error('Failed to send max tray reached notification');
      }
      */
      // If successful, reset to cabinet selection


      resetToCabinetSelection();
    } catch (error) {
      console.error("Error sending max tray notification:", error);
      setError(error.message);
    }



  }

  function clearAndReturn() {
    localStorage.clear();
    Navigate("/activeOrdersMobile");
  }
  function validateTray() {
    console.log("Validate Tray Entry");

    let traylabel = document.getElementById("submission").value;
    console.log("Validate Tray Value: " + traylabel);
    // Check if we've reached the maximum tray count
    if (submittedTrays.length >= maxTrayCount - 1) { // -1 because we're about to add one more
      //handleMaxTrayReached();
      //return;
    }

    // Check if we've reached the maximum tray count
    if (submittedTrays.length >= maxTrayCount) {
      setError("Maximum tray count reached for this cabinet.");
      return;
    }

    // Check if tray type is already submitted
    const trayType = traylabel.split("-")[1];
    if (submittedTrays.map(tray => tray[0]).some(tray => tray.wo_traylabel.indexOf("-" + trayType + "-") >= 0)) {
      setError("Tray " + trayType + " already scanned for this packlot.");
      return;
    }

    // Check if this tray has already been submitted
    if (submittedTrays.map(tray => tray[0]).some(tray => tray.wo_traylabel === traylabel)) {
      //Should rewrite this to check by wo_tray_id instead of traylabel
      setError("Tray " + traylabel + " already scanned.");
      return;
    }

    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/checkTray/${localStorage.getItem("workorder_id")}/${traylabel}`, {
      method: "POST",
    })
      .then((response) => {
        if (response.status === 400) {
          console.error('Error: Bad Request for the tray label');
        } else if (!response.ok) {
          throw new Error('Failed to reach checkTrayLabel endpoint');
        }
        return response.json();
      })
      .then((data) => {
        console.log("API response:", JSON.stringify(data));
        if (data.success === 0) {
          setError(data.message);
          return;
        }

        // Add the new tray to the state
        setSubmittedTrays(prevTrays => {
          const newTray = {
            ...data.data,
          };
          const newTrays = [...prevTrays, newTray];
          // Update localStorage
          localStorage.setItem("SubmittedTrays", JSON.stringify(newTrays));
          // Check if we've reached max tray count after adding this tray
          if (newTrays.length === maxTrayCount) {
            console.log("Reached Max Tray count")
            handleMaxTrayReached();
          }
          return newTrays;
        });

        // Clear the input field
        document.getElementById("submission").value = '';

        // Clear any previous errors
        setError(null);
      })
      .catch((error) => {
        console.error('Fetch error:' + error.message, error);
        setError(error.message);
      });
  }


  return (

    <Container component="main" >

      <div >
        {/* <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar> */}
        {/*CompleteKit ?  <InstantMessage message = {"Kit Complete!"} /> : `` */}
        <AppBar position="static" id="appbar">
          <Toolbar>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={1}>
                <Typography variant="subtitle2">
                  IKB | 2.0 <IconButton onClick={() => { clearAndReturn() }}> <HandymanIcon sx={{ color: "White" }} /> </IconButton>
                </Typography>
                <Typography variant="subtitle2" >
                  BETA
                </Typography>
              </Grid>
              <Grid item xs={12} sm={9}>
                <Box display="flex" justifyContent="space-between" flexWrap="wrap">
                  <Typography variant="body2">
                    <b>Order ID:</b> {localStorage.getItem("WorkOrder") || "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    <b>Product:</b> {localStorage.getItem("ItemDescription") || "N/A"}
                  </Typography>
                  {activeCabinet && activeCabinet[0] && (
                    <Typography variant="body2">
                      <b>Active Packlot:</b> {activeCabinet[0].wo_cabinetlabel}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Toolbar>
        </AppBar>



        <form >
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="printerName"
            label="Please Scan Printer"
            disabled={cabinetSubmitted}
            autoFocus
            error={printerFielderror}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="submission"
            autoFocus={cabinetSubmitted}
            label={cabinetSubmitted ? "Please Scan Tray" : "Please Scan Packlot"}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleSubmit}
          >
            {cabinetSubmitted ? "Scan Tray" : "Scan Packlot"}
          </Button>


        </form>

        {printerFielderror && (
          <Typography color="error">{printerFielderror}</Typography>
        )}
        {error && (
          <Typography color="error">{error}</Typography>
        )}

        <Typography>
          Trays submitted: {submittedTrays.length} / {maxTrayCount}
        </Typography>


        {submittedTrays.length > 0 && (
          <Box mt={3}>
            <Typography variant="h6">Submitted Trays:</Typography>
            <ul>
              {submittedTrays.map((tray, index) => (
                <li key={index}>{tray[0].wo_traylabel} | {tray[0].wo_tray_id}</li>
              ))}
            </ul>
          </Box>
        )}


      </div>
      {/* <Box mt={8}>
        <Copyright />
      </Box> */}
    </Container>
  );
}