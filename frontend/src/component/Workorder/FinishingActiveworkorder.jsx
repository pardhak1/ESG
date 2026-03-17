
import * as React from 'react';
import Button from '@mui/material/Button';
import "../Workorder/active.scss"
import { useNavigate } from 'react-router-dom';
import HandymanIcon from '@mui/icons-material/Handyman';
import { AppBar, Toolbar, Typography, Grid, Box } from '@mui/material';



// import IconButton from '@mui/material/IconButton';
// import MenuIcon from '@mui/icons-material/Menu';
export const FinishingActiveworkorder = () => {
  const navigate = useNavigate();

  const [workOrder, setWorkOrder] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const bearer = localStorage.getItem('data')
  React.useEffect(() => {
    console.log("Finishing Active WorkOrder");
    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/getic`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {


        setWorkOrder(data.data);
        setLoading(false);
        console.log(data);
      })
      .catch((error) => console.log(error));
  }, []);

  console.log(workOrder)
  const [responseData, setResponseData] = React.useState(null);
  console.log(responseData)
  const getKitCode = (e) => {

    localStorage.setItem('kit_code', e.kit_code);
    localStorage.setItem('WorkOrder', e.work_order)
    localStorage.setItem('workorder_id', e.wo_id)
    navigate('/FinishingStation')
    alert(e.kit_code)
    const postData = {
      key1: `${e}`,
    };

    // Fetch options for the POST request
    const fetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(postData)
    };

  }
  console.log(workOrder)
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" id="appbar">
        <Toolbar>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={1}>
              <Typography variant="subtitle2">
                IKB | 2.0   <HandymanIcon sx={{ color: "White" }} />
              </Typography>
            </Grid>
            <Grid item xs={12} sm={9}>
              <Box display="flex" justifyContent="space-between" flexWrap="wrap">
              </Box>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
      <Typography align="center" variant="h6">Finishing Active Work Orders/ ÓRDENES DE TRABAJO ACTIVAS </Typography>
      <div className='finishing_active_orders'>
        {workOrder.map((e, index) => {
          return (
            <li key={index} onClick={() => getKitCode(e)}>{e.work_order}</li>
          )
        })}
      </div>
    </Box>
  );
}
