const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

class Elevator {
  constructor(io, id) {
    this.id = id;
    this.currentFloor = 0;
    this.requests = [];
    this.moving = false;
    this.io = io;
  }

  requestFloor(from, to) {
    this.requests.push({targetFloor: from, isPickup: true});
    this.requests.push({targetFloor: to, isPickup: false});
    if (!this.moving) this.processRequests();
  }

  async processRequests() {
    this.moving = true;
    while (this.requests.length > 0) {
      const nextRequest = this.requests.shift();
      await this.moveToFloor(nextRequest.targetFloor, nextRequest.isPickup);
      // this.returnToLobby();
    }
    this.moving = false;
    console.log(`Lift ${this.id} finished processing requests`);
  }

  async moveToFloor(targetFloor, isPickup) {
    const travelTime = Math.abs(this.currentFloor - targetFloor) * 200;
    console.log(`Lift ${this.id} moving from floor ${this.currentFloor} to floor ${targetFloor}`);
    this.io.emit('elevatorMove', { id: this.id, from: this.currentFloor, to: targetFloor, isPickup });
    await new Promise(resolve => setTimeout(resolve, travelTime));
    this.currentFloor = targetFloor;
    console.log(`Lift ${this.id} arrived at floor ${targetFloor}`);
    this.io.emit('elevatorArrived', { id: this.id, floor: targetFloor, isPickup });
  }

  returnToLobby() {
    if (this.currentFloor !== 0) {
      this.requests.push(0);
      this.processRequests();
    }
  }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const elevators = [0, 1, 2].map(id => new Elevator(io, id));

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('requestFloor', (from, to) => {
        const bestElevator = findBestElevator(from);
        bestElevator.requestFloor(from, to);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const findBestElevator = (targetFloor) => {
  return elevators.reduce((prev, curr) => {
    const prevDistance = Math.abs(prev.currentFloor - targetFloor);
    const currDistance = Math.abs(curr.currentFloor - targetFloor);
    
    return (!prev.moving && curr.moving) ? prev :
           (prevDistance < currDistance && !prev.moving) ? prev : curr;
  });
}

server.listen(3000, () => console.log('Server running on port 3000'));