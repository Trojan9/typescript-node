"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usersRouter = (0, express_1.Router)();
const mysql_1 = __importDefault(require("mysql"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var JWT_SECRET_KEY = "SJKDHDH$5FSRTV6789@#$%^&*(HDGDFDBFJHFN}BGGDG{JDHTEGDMD";
usersRouter.get('/', (req, res) => {
    return res.json({ "status": "success" });
});
usersRouter.post('/change-password', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { newpassword: passwordPlainText, token } = req.body;
    if (!passwordPlainText || typeof passwordPlainText !== "string") {
        return res.json({ status: "error", message: "Invalid Password" });
    }
    if (passwordPlainText.length < 5) {
        return res.json({ status: "error", message: "Password too short, should be atleast 5 characters" });
    }
    try {
        //we extract the user info from the hashedtoken
        var userfromjwt = jsonwebtoken_1.default.verify(token, JWT_SECRET_KEY);
        //we get the id which we will use to retriev user from mongodb
        const email = userfromjwt.email;
        //we hash the new password
        const hashedpassword = yield bcrypt_1.default.hash(passwordPlainText, 10);
        //then we update the userpass
        var pool = mysql_1.default.createPool({
            host: process.env.HOST,
            user: process.env.USER,
            password: process.env.PASSWORD,
            database: process.env.DATABASE,
            connectionLimit: 10,
            multipleStatements: true
        });
        pool.getConnection(function (err, conn) {
            return __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    console.log(err.toString());
                    res.json({
                        "success": false,
                        "statuscode": 500,
                        "message": err.toString()
                    });
                }
                else {
                    conn.query(`UPDATE USERS SET password = ? WHERE email = ?`, [hashedpassword, email], function (err, rows) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (err) {
                                res.json({
                                    "success": false,
                                    "statuscode": 400,
                                    "message": err.toString()
                                });
                            }
                            else {
                                return res.json({
                                    "success": true,
                                    "message": "Updated successful",
                                    "data": rows,
                                    "token": token
                                });
                            }
                        });
                    });
                }
            });
        });
    }
    catch (error) {
        return res.json({ status: "error", message: "Authentication Failed" });
    }
}));
usersRouter.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    var pool = mysql_1.default.createPool({
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE,
        connectionLimit: 10,
        multipleStatements: true
    });
    try {
        pool.getConnection(function (err, conn) {
            return __awaiter(this, void 0, void 0, function* () {
                if (err) {
                    console.log(err.toString());
                    res.json({
                        "success": false,
                        "statuscode": 500,
                        "message": err.toString()
                    });
                }
                else {
                    conn.query('SELECT * FROM USERS WHERE email=?', [username], function (err, rows) {
                        return __awaiter(this, void 0, void 0, function* () {
                            if (err) {
                                res.json({
                                    "success": false,
                                    "statuscode": 400,
                                    "message": err.toString()
                                });
                            }
                            else {
                                if (!rows[0]) {
                                    return res.json({ status: "error", message: "Invalid Username or Password" });
                                }
                                if (yield bcrypt_1.default.compare(password, rows[0].password)) {
                                    //since we cannot get the same encrypted password as the one we stored on the db i.e for every time we encrpyt the same words ,we will get different encrpytions..so we need a way to compare the present password to the one in the database
                                    const token = jsonwebtoken_1.default.sign({
                                        email: rows[0].email,
                                        phone: rows[0].mobile,
                                    }, JWT_SECRET_KEY);
                                    return res.json({
                                        "success": true,
                                        "message": "Login successful",
                                        "data": rows,
                                        "token": token
                                    });
                                }
                                else {
                                    return res.json({ status: "error", message: "Invalid Username or Password" });
                                }
                            }
                        });
                    });
                }
            });
        });
    }
    catch (error) {
        //to know the error from the mongoose they use error codes
        if (error) {
            return res.json({ status: "error", message: error.toString() });
        }
        else {
            throw error;
        }
    }
}));
usersRouter.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password: passwordPlainText, phone } = req.body; //this will get password and store in passwordplaintext
    function isValidEmail(email) {
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    }
    if (!username || !isValidEmail(username)) {
        console.log(isValidEmail(username));
        return res.json({ status: "error", message: "Invalid Username" });
    }
    if (!passwordPlainText || passwordPlainText.length < 5) {
        return res.json({ status: "error", message: "Invalid Password or Password should be greater than 5" });
    }
    if (passwordPlainText.length < 3) {
        return res.json({ status: "error", message: "Password too short, should be atleast 3 characters" });
    }
    const password = yield bcrypt_1.default.hash(passwordPlainText, 10);
    console.log(password);
    //note to store our password it is common practice to hash our passwords for a level of user security
    //we can use bcrypt, md5, sha1,sha256,sha512
    //1.collision should be improbable
    //2. algorithms should be slow
    //hashing_function()->3436464hbdgfhfnbfhdyhq@#444547
    //hashing password
    //now to creat user in the database
    try {
        var pool = mysql_1.default.createPool({
            host: process.env.HOST,
            user: process.env.USER,
            password: process.env.PASSWORD,
            database: process.env.DATABASE,
            connectionLimit: 10,
            multipleStatements: true
        });
        pool.getConnection(function (err, conn) {
            if (err) {
                console.log(err.toString());
                return res.json({
                    "success": false,
                    "statuscode": 500,
                    "message": err.toString()
                });
            }
            else {
                let sqlquery = `call registerUser(?,?,?)`;
                conn.query(sqlquery, [username, phone, password], function (err, rows) {
                    if (err) {
                        return res.json({
                            "success": false,
                            "statuscode": 400,
                            "message": err.toString()
                        });
                    }
                    else {
                        return res.send({
                            "success": true,
                            "message": "User Created Successfully",
                            "statuscode": 200
                        });
                    }
                });
            }
        });
    }
    catch (error) {
        //to know the error from the mongoose they use error codes
        if (error) {
            return res.json({ status: "error", message: error.toString() });
        }
        else {
            throw error;
        }
        //  console.log(JSON.stringify(error))//this will output error in json format and even show the error code from mongodb
        // res.json({status:error.message})
    }
}));
exports.default = usersRouter;
