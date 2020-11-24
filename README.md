# huluparty-server
> The server component of HuluParty

## Table of contents
* [General info](#general-info)
* [Screenshots](#screenshots)
* [Technologies](#technologies)
* [Setup](#setup)
* [Features](#features)
* [Status](#status)
* [Inspiration](#inspiration)
* [Contact](#contact)

## General info
The server is the central component of HuluParty. It is responsible for:
* Creating and storing new sessions
* Updating sessions and delegating those updates to participating users
* Synchronizing users with necessary video metadata when they ask to join a specific session

In order for the HuluParty [client](https://github.com/kcharellano/huluparty-client) to work, the server must be running.  


## Built-With
* Node - 12.16.2
* npm - 6.14.4
* socket.io - 1.7.4

## Setup
To run the server simply run `index.js` from your terminal.

## Todo
* Clean up stale sessions

## Contact
Created by [kcharellano](https://www.linkedin.com/in/kcharellano/) - feel free to contact me!