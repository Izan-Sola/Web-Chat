const jsdom = require('jsdom')
const dom = new jsdom.JSDOM("")
const $ = require('jquery')(dom.window)
const mysql = require('mysql2/promise');
const bodyParser = require("body-parser");
const path = require("path");
const express = require('express');
const cors = require('cors');
const { NOTFOUND } = require('dns');
const app = express();
const server = require('http').Server(app);
const WebSocketServer = require("websocket").server;
const port = 3000;
app.set('port', 3000);
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static('public'));
const crypto = require('crypto');


const webSocketServer = new WebSocketServer({
    httpServer: server,
    autoAcceptConnections: false // Enable origin validation
});
const connectionsList = []; // List of active connections

webSocketServer.on("request", function (req) {
    if (req.origin === 'https://monthly-devoted-pug.ngrok-free.app') {
        const connection = req.accept(null, req.origin);
        console.log('Connection accepted from:', req.origin);

        if (!connectionsList.includes(connection)) {
            connectionsList.push(connection);
        }
        connection.on("message", function (msg) {
            connectionsList.forEach((conn) => {
                if (conn.connected) {
                    conn.sendUTF(`${msg.utf8Data}`);
                }
            });
        });

        connection.on("close", function () {
            console.log('Connection closed');

            const index = connectionsList.indexOf(connection);
            if (index !== -1) {
                connectionsList.splice(index, 1);
            }
        });
    } else {
        req.reject();
        console.log('Connection rejected from:', req.origin);
    }
});

server.listen(3000, '172.30.135.220', () => {
    console.log('Server started')
})

async function dataBaseConnection(action, name, password, age, description, friend, clientIP) {
    const con = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "chat"
    });

    try {
        existingUsers = []
        switch (action) {

            case 'newUser':
                const [existingUsers] = await con.query('SELECT * FROM users WHERE username = ?', [name]);
                if (existingUsers.length > 1) {
                    return { error: 'DUPLICATEDUSER' };

                }
                sessionKey = crypto.randomBytes(32).toString('hex')

                const newUser = "INSERT INTO users SET username = ?, password = ?, sessionkey = ?, ip = ?";
                await con.query(newUser, [name, password, sessionKey, clientIP]);

                return { message: 'New user inserted successfully', sessionKey: sessionKey  };

            case 'checkLoginCredentials':

                message = 'LOGIN SUCCESSFUL!'

                const [pass] = await con.query('SELECT password FROM users WHERE username = ?', [name])
                const key = await con.query('SELECT sessionkey FROM users WHERE username = ?', [name])
              
                if (pass.length < 1) {
                    message = 'USER DOESNT EXIST'
                }
                else {
                    pass.forEach(element => {
                        if (element.password != password) {
                            message = 'INCORRECT PASSWORD'
                        }
                    });
                }
                return { message: message, sessionKey: key }

            case 'updateProfile':
                 const newAge = "UPDATE users SET age = ? WHERE sessionkey = ?"
                 await con.query(newAge, [age, name]);

                 const newDescription = "UPDATE users SET description = ? WHERE sessionkey = ?"
                 await con.query(newDescription, [description, name]);

                 message = 'Porfile updated successfully'
                 return { message: message }

            case 'loadProfile':
                const userDesc =  await con.query('SELECT description FROM users WHERE sessionkey = ?', [name])
                const userAge =  await con.query('SELECT age FROM users WHERE sessionkey = ?', [name])
                const userName =  await con.query('SELECT username FROM users WHERE sessionkey = ?', [name])
                return { userAge: userAge, userDesc: userDesc, userName: userName }

            case 'loadStrangerProfile':
                const strangerDesc =  await con.query('SELECT description FROM users WHERE username = ?', [name])
                const strangerAge =  await con.query('SELECT age FROM users WHERE username = ?', [name])
                const strangerName =  await con.query('SELECT username FROM users WHERE username = ?', [name])

                return { strangerAge: strangerAge, strangerDesc: strangerDesc, strangerName: strangerName }
        
            case 'sendFriendRequest':

                return { idk: idk}
        }
    } catch (err) {
        console.error('Database operation error:', err);
        return { error: 'ERROR' };
    } finally {
        await con.end();
    }
}

app.post('/databaseupdates', async (req, res) => {
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const { action, name, password, age, description, friend } = req.body;
    const result = await dataBaseConnection(action, name, password, age, description, friend, clientIP);
    res.json(result);
});