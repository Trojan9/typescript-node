"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const mysql_1 = __importDefault(require("mysql"));
const dotenv_1 = __importDefault(require("dotenv"));
const routes_1 = __importDefault(require("./routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
app.use(routes_1.default);
//or you can use express cause bodyparser seems deprecated
// app.use(express.urlencoded({extended:true}));
// app.use(express.json());
app.get('/', (req, res) => {
    return res.send("well done!");
});
app.post("/register", (req, res) => {
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
            conn.query(sqlquery, [req.body.email, req.body.phone, req.body.password], function (err, rows) {
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
                        "statuscode": 200
                    });
                }
            });
        }
    });
});
app.get('/id/:id/name/:name', (req, res) => {
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
            res.json({
                "success": false,
                "statuscode": 500,
                "message": err.toString()
            });
        }
        else {
            console.log(req.params.id);
            conn.query('SELECT * FROM actor WHERE actor_id=?', [req.params.id], function (err, rows) {
                if (err) {
                    res.json({
                        "success": false,
                        "statuscode": 400,
                        "message": err.toString()
                    });
                }
                else {
                    res.send({
                        "success": true,
                        "params": {
                            "id": req.params.id,
                            "Name": req.params.name
                        }, "data": rows
                    });
                }
            });
        }
    });
});
app.post('/id/:id/name/:name', (req, res) => {
    res.send({
        "statuscode": 200,
        "data": req.body,
        "params": {
            "id": req.params.id,
            "Name": req.params.name
        }
    });
});
app.listen(process.env.PORT, () => {
    console.log('application is listening on port 3000!');
});
