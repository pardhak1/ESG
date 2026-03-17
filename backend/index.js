require("dotenv").config();
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const cors = require('cors')
const path = require('path');
const userRouter = require("./api/user.router");
const scanRouter = require("./api/scan.router");
const palletBulkRouter = require("./api/pallet-bulk.router");

const cookieParser = require('cookie-parser');


app.use(cookieParser());
app.use(express.json())

app.use(bodyParser.json()) 
app.use(cors())
app.use(
  express.urlencoded({
    extended: true,
  })
);
// app.use(cors({ origin: true, credentials: true})); 
app.use("/api/users", userRouter); 
app.use("/api/scan", scanRouter); 
app.use("/api/pallet-bulk", palletBulkRouter);

// Serve static files for pallet utility
app.use('/pallet-utility', express.static(path.join(__dirname, 'public/pallet-utility')));

app.listen(process.env.port, () => {
    console.log("server up and running on PORT :", process.env.port);
  });