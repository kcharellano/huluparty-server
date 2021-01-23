const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const crypto = require("crypto");

//Express and Socketio middleware
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// Metadata constants
const USER_ID = "userId";
const SESSION_ID = "sessionId";
const LAST_ACTIVITY = "lastActivity";
const LAST_VID_POS = "lastVideoPos";
const PLAY_STATE = "state";
const VIDEO_ID = "videoId";
const USER_LIST = "users";
const USER_SOCK = "socket";

/**********
    DATABASE
**********/
// in-memory store of all the sessions
// the keys are the session IDs (strings)
// the values have the form: {
//   id: '84dba68dcea2952c',             // 8 random octets
//   lastActivity: new Date(),           // used to find old sessions to vacuum
//   lastKnownTime: 123,                 // milliseconds from the start of the video
//   lastKnownTimeUpdatedAt: new Date(), // when we last received a time update
//   state: 'playing' | 'paused',        // whether the video is playing or paused
//   videoId: 123                        //  id the video
// }
var sessionDB = {}

// in-memory store of all the users
// the keys are the user IDs (strings)
// the values have the form: {
//   id: '3d16d961f67e9792',        // 8 random octets
//   sessionId: 'cba82ca5f59a35e6', // id of the session, if one is joined
//   socket: <websocket>,           // the clients websocket
//   typing: false                  // whether the user is typing or not
// }
var userDB = {}



//================================================================================
// Express 
//================================================================================
app.get('/', (request, response) =>{
    console.log("GET REQUEST RECEIVED");
    response.redirect("https://www.hulu.com");
    //response.status(200).end();
});

server.listen(3000, () => {
    console.log("LISTENING ON PORT 3000!");
});

//================================================================================
// Socket.io
//================================================================================

// TODO: santitize input
// TODO: on disconnect remove users from DB

io.on("connect", (socket) => {
    console.log("A USER HAS CONNECTED TO SOCKET");
    // Create user and add them to userDB
    let newUserId = createUser(socket)
    // Return Id back to user
    socket.emit("newUser", newUserId);

    socket.on('createSession', (data) => {
        // Create new session and return sessionId back to client
        let sessionId = createSession(data);
        socket.emit('newSession', sessionId);
    });

    socket.on('joinSession', (data) => {
        // add user to session and return video synchronization data
        let syncData = joinSession(data);
        socket.emit('returnSession', syncData);
    });

    socket.on('updateSession', (data) => {
        // Update all fields for session on server
        // and propogate those updates to other users
        updateSession(data);
    });

    socket.on('disconnect', () =>{
        console.log("USER HAS DISCONNECTED");
    });
});

//================================================================================
// Util functions
//================================================================================

// Create a random 8-byte string
function idGenerator() {
    return crypto.randomBytes(8).toString('hex');
}

// return UTC time in seconds
function currentTime() {
    let d = new Date();
    return (d.getTime() + d.getTimezoneOffset()*60*1000)/1000;
}

function createUser(socket) {
    //create new user object
    let newUserId = idGenerator();
    let newUserObj = {
        [USER_ID]: newUserId,
        [SESSION_ID]: null,
        [USER_SOCK]: socket
    }
    // add new user to userDB
    userDB[newUserId] = newUserObj;
    return newUserId;
}

// Adds a new session to sessionDB and returns its ID
function createSession(metadata) {
    let sessionId = idGenerator();
    let session = { 
        [SESSION_ID]: sessionId,
        [LAST_ACTIVITY]: currentTime(),
        [LAST_VID_POS]: metadata[LAST_VID_POS],
        [PLAY_STATE]: metadata[PLAY_STATE],
        [VIDEO_ID]: metadata[VIDEO_ID],
        [USER_LIST]: [metadata[USER_ID]]
    };
    sessionDB[sessionId] = session;
    console.log("new session created");
    console.log(sessionDB);
    return sessionId;
}

// add user to session and return metadata synchronization metadata
function joinSession(metadata) {
    let newUser = metadata[USER_ID];
    let id = metadata[SESSION_ID];
    // add user to session if user NOT in session
    if(!sessionDB[id][USER_LIST].includes(newUser)){
        sessionDB[id][USER_LIST].push(newUser);
    }
    let syncData = {
        [LAST_VID_POS]: sessionDB[id][LAST_VID_POS],
        [PLAY_STATE]: sessionDB[id][PLAY_STATE]
    };
    return syncData;
}

function updateSession(metadata) {
    let s_id = metadata[SESSION_ID];
    let invokingUser = metadata[USER_ID];

    // update session on server if it exists
    if(sessionDB[metadata[SESSION_ID]]){
        Object.keys(metadata).forEach((key, index) => {
            if(key === SESSION_ID || key === USER_ID){
                return;
            }
            else{
                sessionDB[s_id][key] = metadata[key];
            }
        });

        // Propogate updates to all users except sending user
        sessionDB[s_id][USER_LIST].forEach((user, index) => {
            if(user === invokingUser) {
                console.log("Fake continue");
            }
            else {
                userDB[user][USER_SOCK].emit("videoUpdate", metadata);
            }
        });
        console.log("SESSION UPDATED");
        console.log(sessionDB);
    }
    else{
        console.log(`Session ${sessionId} does not exist.`);
    }
}
