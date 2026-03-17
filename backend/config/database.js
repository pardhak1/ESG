const mysql= require("mysql");
const connection = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database
  }); 
  
  // Connect to MySQL

  var keepAlive = 50000;
  connection.connect((error) => {
    if(error) {
        console.log("Error while connecting Database " + error)
        return;
    } 
    console.log("Database connection was successful to DB: " + process.env.database + " Using Keep Alive interval of: " + keepAlive + " ms");

    setInterval(function () {
      connection.query('SELECT 1');
      console.log("Keep Alive")
  }, keepAlive);

  });

  module.exports=connection;