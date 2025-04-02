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
    }
    this.moving = false;
    console.log(`Lift ${this.id} finished processing requests`);
  }

  async moveToFloor(targetFloor, isPickup, isReturn = false) {
    const travelTime = Math.abs(this.currentFloor - targetFloor) * 200;
    console.log(`Lift ${this.id} moving from floor ${this.currentFloor} to floor ${targetFloor}`);
    this.io.emit('elevatorMove', { id: this.id, from: this.currentFloor, to: targetFloor, isPickup });
    await new Promise(resolve => setTimeout(resolve, travelTime));
    this.currentFloor = targetFloor;

    console.log(`Lift ${this.id} arrived at floor ${targetFloor}`);
    if (!isReturn) {
      this.io.emit('elevatorArrived', { id: this.id, floor: targetFloor, isPickup });
    }
  }

  returnToLobby() {
    if (this.currentFloor !== 0) {
      this.moveToFloor(1, false, true);
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

    socket.on('returnToLobby', () => {
      elevators.forEach(elevator => elevator.returnToLobby());
  });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const findBestElevator = (targetFloor) => {
  const elevatorScores = elevators.map(elevator => {
    const distance = Math.abs(elevator.currentFloor - targetFloor);
    const queueLength = elevator.requests.length;
    
    let score = distance * 2;
    score += queueLength * 3;
    score += elevator.moving ? 5 : 0;
    
    return {
      elevator,
      score
    };
  });

  // choose the elevator with the lowest score
  return elevatorScores.reduce((best, current) => 
    current.score < best.score ? current : best
  ).elevator;
}

server.listen(3000, () => console.log('Server running on port 3000'));