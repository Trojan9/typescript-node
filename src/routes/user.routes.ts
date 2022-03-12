import { Router,Request,Response } from 'express';
const usersRouter=Router();
import mysql from 'mysql';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

var JWT_SECRET_KEY="SJKDHDH$5FSRTV6789@#$%^&*(HDGDFDBFJHFN}BGGDG{JDHTEGDMD";

usersRouter.get('/',(req:Request,res:Response)=>{
   return res.json({"status":"success"})
});
usersRouter.post('/change-password',async(req,res)=>{
    const {newpassword:passwordPlainText,token}=req.body
    if(!passwordPlainText||typeof passwordPlainText !=="string"){
        return res.json({status:"error",message:"Invalid Password"})
    }
    if(passwordPlainText.length<5){
        return res.json({status:"error",message:"Password too short, should be atleast 5 characters"})
    }
    
    try{
        //we extract the user info from the hashedtoken
        var userfromjwt:any=jwt.verify(token,JWT_SECRET_KEY)
        //we get the id which we will use to retriev user from mongodb
        const email=userfromjwt.email
        //we hash the new password
        const hashedpassword=await bcrypt.hash(passwordPlainText,10)
        //then we update the userpass
        
        var pool= mysql.createPool({
            host: process.env.HOST,
            user: process.env.USER,
            password: process.env.PASSWORD,
            database: process.env.DATABASE,
            connectionLimit:10,
            multipleStatements:true
          });
          pool.getConnection(async function(err:any,conn:any){
              if(err){
                  console.log(err.toString());
                  res.json({
                      "success":false,
                      "statuscode":500,
                      "message":err.toString()
                  })
              }
              else{
                  
                  conn.query(`UPDATE USERS SET password = ? WHERE email = ?`,[hashedpassword,email],async function(err:any,rows:any){
                      if(err){
                        res.json({
                            "success":false,
                            "statuscode":400,
                            "message":err.toString()
                        })
                      }else{
                        
                                return res.json({
                                    "success":true,
                                    "message":"Updated successful",
                                "data":rows,
                                "token":token
                           
                            });
                        
                      }
                  })
                 
              }
          })
    }catch(error){
        return res.json({status:"error",message:"Authentication Failed"})
    }
});
usersRouter.post('/login',async(req,res)=>{
    const {username,password}=req.body
    var pool= mysql.createPool({
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
        connectionLimit:10,
        multipleStatements:true
      });
      try{
      pool.getConnection(async function(err:any,conn:any){
          if(err){
              console.log(err.toString());
              res.json({
                  "success":false,
                  "statuscode":500,
                  "message":err.toString()
              })
          }
          else{
              
              conn.query('SELECT * FROM USERS WHERE email=?',[username],async function(err:any,rows:any){
                  if(err){
                    res.json({
                        "success":false,
                        "statuscode":400,
                        "message":err.toString()
                    })
                  }else{
                    if(!rows[0]){
                        return res.json({status:"error",message:"Invalid Username or Password"})
                       }
                        if( await bcrypt.compare(password, rows[0].password)){
                            //since we cannot get the same encrypted password as the one we stored on the db i.e for every time we encrpyt the same words ,we will get different encrpytions..so we need a way to compare the present password to the one in the database
                            const token=jwt.sign({
                                email:rows[0].email,
                                phone:rows[0].mobile,
                            },JWT_SECRET_KEY)
                            return res.json({
                                "success":true,
                                "message":"Login successful",
                            "data":rows,
                            "token":token
                        });
                        }else{
                            return res.json({status:"error",message:"Invalid Username or Password"})
                        }
                    
                  }
              })
             
          }
      })}catch(error:any){
        //to know the error from the mongoose they use error codes
        if(error){
            return res.json({status:"error",message:error.toString()})
        }else{
            throw error
            
        }
    
    }
});
usersRouter.post('/register',async(req,res)=>{
    const {username,password:passwordPlainText,phone}=req.body//this will get password and store in passwordplaintext
    function isValidEmail(email:any) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
      }
    
    if(!username||!isValidEmail(username)){
        console.log(isValidEmail(username));
        return res.json({status:"error",message:"Invalid Username"})
    }
    if(!passwordPlainText||passwordPlainText.length<5){
        return res.json({status:"error",message:"Invalid Password or Password should be greater than 5"})
    }
    if(passwordPlainText.length<3){
        return res.json({status:"error",message:"Password too short, should be atleast 3 characters"})
    }
    const password=await bcrypt.hash(passwordPlainText,10)
    console.log(password)
    //note to store our password it is common practice to hash our passwords for a level of user security
//we can use bcrypt, md5, sha1,sha256,sha512
//1.collision should be improbable
//2. algorithms should be slow
//hashing_function()->3436464hbdgfhfnbfhdyhq@#444547
//hashing password

//now to creat user in the database
try{
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
             
              conn.query(sqlquery,[username,phone,password],function(err:any,rows:any){
                  if(err){
                   return res.json({
                        "success":false,
                        "statuscode":400,
                        "message":err.toString()
                    })
                  }else{
                  return  res.send({
                        "success":true,
                        "message":"User Created Successfully",
                        "statuscode":200});
                  }
              })
             
          }
      });
}catch(error:any){
    //to know the error from the mongoose they use error codes
    if(error){
        return res.json({status:"error",message:error.toString()})
    }else{
        throw error
        
    }
    //  console.log(JSON.stringify(error))//this will output error in json format and even show the error code from mongodb
    // res.json({status:error.message})

}
   
});
export default usersRouter;