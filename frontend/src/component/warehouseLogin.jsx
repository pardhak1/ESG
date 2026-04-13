import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/system';
import Container from '@mui/material/Container';

import logo from './Images/esglogo.png';


const useStyles = styled((theme) => ({
  paper: {
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));



export default function SignIn() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  // const [devMode] = useState(false)
  // const [userAPiResponseData,setUserAPIResponseData]=useState('')

  /**
   * 
   * Login API Function 
   */

  const handleuserLogin = async (e) => {
    e.preventDefault();
    const loginDetails = { email: email, password: password };
    try {
      const response = await fetch(`${process.env.REACT_APP_Login}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginDetails),
        // credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Error! status: ${response.status}`);
      }

      const result = await response.json();
      // devMode === true ?  console.log('Login Successful:', result) : ""
      // setUserAPIResponseData(result)
      localStorage.setItem('data', result)
      const getLocalStorageData = localStorage.getItem('data')

      if (getLocalStorageData !== "") {
        window.location.href = '/activeordersMobile'
      } else {
        window.location.href = '/'
      }


      // You might want to save the token in localStorage/sessionStorage and redirect the user
      // localStorage.setItem('token', result.token);
      // Redirect user to another page or set authentication state

    } catch (error) {
      // devMode === true ? 
      console.error('Failed to login:', error)

      // : ""
      setError(error.message);
    }
  }

  const classes = useStyles();

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        {/* <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar> */}
        <Typography component="h1" variant="h4">
          Login
        </Typography>
        <img src={logo} alt='' style={{ width: '400px', height: '60px' }} />
        <form className={classes.form} noValidate>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            onChange={(e) => setEmail(e.target.value)}
            label="WarehouseID"
            name="email"
            autoFocus
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
            onClick={handleuserLogin}
          >
            Sign In
          </Button>
          <Grid container>
            <Grid item xs>
              <Link href="#" variant="body2">
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link href="#" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </form>
      </div>
      {/* <Box mt={8}>
        <Copyright />
      </Box> */}
    </Container>
  );
}
