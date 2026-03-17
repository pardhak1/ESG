const connection = require("../config/database");
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
app.use(bodyParser.json());


module.exports ={
createScan:(req,res,next) =>{

        const scan_upc = data.upc;
        const exp_date = data.exp_date;
        const barcode = data.barcode;
        
    
    bcrypt.hash(password,10,(err,hash) =>{
        if(err) {
          next(err)
        } else {
            const user = { email, password: hash };
            console.log(user);
         
            connection.query('INSERT INTO users SET ?', [user], (err,results,fields) => {
                if(err) {

                  next(err)
                } else {
                    return next(null,results)
                }
            })
        }
    })
   
}
,



getBOM:(req,res,next) => {

  //Return all boms 
    connection.query(
      `select * from bom_tray where tray_id = 1`,
      [],
      (error, results, fields) => {
        if (error) {
          next(error);
        }
        console.log(results);
        return next(null, results);
      }
    );

  },
  getIncompleteWorkOrders:(req,res,next) => {
    console.log(res);

    //Return all workorders with a null complete_date or start date
      connection.query(
        `SELECT wo.kit_code, wo.wo_qty, wo.add_date, wo.start_date, wo.complete_date, wo.wo_id,wo.work_order,wo.prod_order,
        master_kit.kit_desc,master_kit.kit_upc,master_kit.lens_count,master_kit.tray_count,master_kit.col_count,master_kit.row_count,master_kit.kit_id 
        from wo Inner join master_kit 
        on wo.kit_code = master_kit.kit_code
        where wo.complete_date = "" OR start_date = ""`,
        [],
        (error, results, fields) => {
          if (error) {
            next(error);
          }
          console.log("Scan Service \n");
         // console.log(results);
          next(results);
        }
      );
  
    },

    getWorkOrdersByID: (wo_id, callBack) => {

      //Return specific workorder  
        connection.query(
          `SELECT wo.kit_code, wo.wo_qty, wo.add_date, wo.start_date, wo.complete_date, wo.wo_id,wo.work_order,wo.prod_order,
          master_kit.kit_desc,master_kit.kit_upc,master_kit.lens_count,master_kit.tray_count,master_kit.col_count,master_kit.row_count,master_kit.kit_id 
          from wo Inner join master_kit 
          on wo.kit_code = master_kit.kit_code
          where wo.work_order = ?`,
          [wo_id],
          (error, results, fields) => {
            if (error) {
              callBack(error);
            }
            return callBack(null, results);
          }
        );
    
      },

  
  getBOMByID: (kit_id, callBack) => {
    connection.query(
      `select * from master_kit where kit_id = ?`,
      [kit_id],
      (error, results, fields) => {
        if (error) {
          callBack(error);
        }
        console.log(results);
        return callBack(null, results[0]);
      }
    );
  },
  
  


    




}
