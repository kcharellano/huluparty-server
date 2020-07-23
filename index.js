const express = require("express");
const http = require("http");
const socketio = require("socket.io");

//Setting up express and adding socketIo middleware
const app = express();
const server = http.createServer(app);
const io = socketio(server);

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
let sessionDB = {}


/**********
    EXPRESS
**********/
app.get('/', (request, response) =>{
    console.log("GET REQUEST RECEIVED");
    response.status(200).end();
});

server.listen(3000, () => {
    console.log("LISTENING ON PORT 3000!");
});

/**********
    SOCKET.IO
**********/

io.on("connect", (socket) => {
    console.log("A USER HAS CONNECTED TO SOCKET");
    //TODO: On create new session make a unique id
    //TODO: santitize input
    socket.on('createSession', (data) => {
        newSession = {};
        newSession["sessionid"] = data["sessionid"];
        newSession["lastActivity"] = data["lastActivity"];
        newSession["lastKnownTime"] = data["lastKnownTime"];
        newSession["state"] = data["state"];
        newSession["videoid"] = data["videoid"];
        sessionDB[data["sessionid"]] = newSession;
        console.log("NEW SESSION CREATED!");
        console.log(sessionDB);
    });

    //TODO: update session that doesnt exist.
    socket.on('updateSession', (data) => {
        let updateSession = data["sessionid"];
        Object.keys(data).forEach((key, index) => {
            if(key == "sessionid"){
                return;
            }
            else{
                sessionDB[updateSession][key] = data[key];
            }
        });
        console.log("SESSION UPDATED");
        console.log(sessionDB);
    });

    socket.on('getSession', (data, ack) => {
        console.log(data);
        if(sessionDB[data["sessionid"]]){
            ack(sessionDB[data["sessionid"]]);
        }
        else{
            ack();
        }
    });
});