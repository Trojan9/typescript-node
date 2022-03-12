import express from 'express';
import bodyParser from 'body-parser';
import { Request,Response } from 'express';
import mysql from 'mysql';
import dotenv from 'dotenv';
import routes from './routes'
dotenv.config();
const app=express()
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(routes);
//or you can use express cause bodyparser seems deprecated
// app.use(express.urlencoded({extended:true}));
// app.use(express.json());
app.get('/',(req,res)=>{
  return  res.send("well done!");
})

app.post("/register",(req,res)=>{

    var pool= mysql.createPool({
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
        connectionLimit:10,
        multipleStatements:true
      });
      pool.getConnection(function(err:any,conn:any){
          if(err){
              console.log(err.toString());
             return res.json({
                  "success":false,
                  "statuscode":500,
                  "message":err.toString()
              })
          }
          else{
             let sqlquery=`call registerUser(?,?,?)`;
             
              conn.query(sqlquery,[req.body.email,req.body.phone,req.body.password],function(err:any,rows:any){
                  if(err){
                   return res.json({
                        "success":false,
                        "statuscode":400,
                        "message":err.toString()
                    })
                  }else{
                  return  res.send({
                        "success":true,
                        "statuscode":200});
                  }
              })
             
          }
      });
});
app.get('/id/:id/name/:name',(req:Request,res:Response)=>{
   var pool= mysql.createPool({
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
        connectionLimit:10,
        multipleStatements:true
      });
      pool.getConnection(function(err:any,conn:any){
          if(err){
              console.log(err.toString());
              res.json({
                  "success":false,
                  "statuscode":500,
                  "message":err.toString()
              })
          }
          else{
              console.log(req.params.id);
              conn.query('SELECT * FROM actor WHERE actor_id=?',[req.params.id],function(err:any,rows:any){
                  if(err){
                    res.json({
                        "success":false,
                        "statuscode":400,
                        "message":err.toString()
                    })
                  }else{
                    res.send({
                        "success":true,
                        "params":{
                        "id":req.params.id,
                        "Name":req.params.name
                    },"data":rows});
                  }
              })
             
          }
      })
    
})
app.post('/id/:id/name/:name',(req:Request,res:Response)=>{
    res.send({
    "statuscode":200,
    "data":req.body,
    "params":{
        "id":req.params.id,
        "Name":req.params.name
    }});
})
app.listen(process.env.PORT,()=>{
    console.log('application is listening on port 3000!');
});