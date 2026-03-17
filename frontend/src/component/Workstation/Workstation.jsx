import * as React from 'react';
import "../Workstation/Workstation.scss"
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Grid, Box, Button, IconButton } from '@mui/material';
import HandymanIcon from '@mui/icons-material/Handyman';


const Workstation = () => {
  const navigate = useNavigate();

  const [workOrder, setWorkOrder] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    console.log("GetStationCount");
    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/stationct/` + localStorage.getItem("kit_code"), {
      method: "GET",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to reach stationct endpoint');
        }
        return response.json();
      })
      .then((data) => {
        console.log("API response:", data);
        setWorkOrder(data.data || []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Fetch error:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  function clearLocalStorage() {
    localStorage.clear();
    navigate("/activeOrders");
  }



  const getWorkstation = (wsId) => {
    const wsIdString = String(wsId);
    localStorage.setItem('Station', wsIdString);
    console.log("GetWorkstation Entry with item |" + wsIdString);
    console.log("Stored in localStorage:", localStorage.getItem('Station'));

    // Navigate with the station as a URL parameter
    navigate(`/Trayid?station=${wsIdString}`);
  }

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (error) {
    return <h1>Error: {error}</h1>;
  }



  console.log("workOrder state:", workOrder);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" id="appbar">
        <Toolbar>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={1}>
              <Typography variant="subtitle2">
                IKB | 2.0  <IconButton onClick={clearLocalStorage}> <HandymanIcon sx={{ color: "White" }} /> </IconButton>
              </Typography>

            </Grid>
            <Grid item xs={12} sm={9}>
              <Box display="flex" justifyContent="space-between" flexWrap="wrap">
                <Typography variant="body2">
                  <b>Order ID:</b> {localStorage.getItem("WorkOrder")}
                </Typography>
                <Typography variant="body2">
                  <b>Product:</b> {(localStorage.getItem("kit_code"))}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <div className='Stations'>
        <h1>STATIONS</h1> <br />
        {workOrder.length > 0 ? (
          workOrder.map((item, index) => (
            <React.Fragment key={index}>
              <Button
                variant="contained"
                className='Button'
                onClick={() => getWorkstation(item.ws_id)}
              >
                Station {item.ws_id}
              </Button>
              <br />
              <br />
            </React.Fragment>
          ))
        ) : (
          <p>No stations available</p>
        )}
      </div>
    </Box>
  );
}

export default Workstation;