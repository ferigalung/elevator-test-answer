import { getElapsedTime } from './helpers.js';

class ElevatorAnimator {
  constructor({socket, elevatorCount, peopleCount = 100, canvasID = 'elevatorCanvas'}) {
    this.canvas = document.getElementById(canvasID);
    this.ctx = this.canvas.getContext('2d');
    this.elevators = Array.from({ length: elevatorCount }, (_, id) => ({
      id: id,
      currentFloor: 0, 
      targetFloor: 0,
      isPickup: false,
      moving: false
    }));
    this.totalFloors = 50;
    this.floorHeight = 14;
    this.elevatorWidth = 10;
    this.elevatorHeight = 13;
    this.deliveredCount = 0;
    this.startTime = null;
    this.finishTime = null;
    this.socket = socket;
    this.peopleQueue = this.generatePeopleQueue(peopleCount);
  }

  generatePeopleQueue(count) {
    const usedCombinations = new Set();
    const result = [];
    
    while (result.length < count) {
      let from = Math.floor(Math.random() * this.totalFloors) + 1;
      let to = Math.floor(Math.random() * this.totalFloors) + 1;
      
      const combination = `${from}-${to}`;
      
      if (from !== to && !usedCombinations.has(combination)) {
        usedCombinations.add(combination);
        result.push({ from, to });
      }
    }
    
    return result;
  }

  initializeSocketListeners() {
    this.socket.on('elevatorMove', ({ id, from, to, isPickup }) => {
      this.elevators[id].currentFloor = from - 1;
      this.elevators[id].isPickup = isPickup;
      this.elevators[id].targetFloor = to - 1;
      this.animate(id);
    });

    this.socket.on('elevatorArrived', ({ id, floor, isPickup }) => {
      this.elevators[id].isPickup = isPickup;
      this.elevators[id].currentFloor = floor - 1;
      this.draw();

      if (!isPickup) {
        this.updateUI();
      }
    });
  }

  startSimulation() {
    this.peopleQueue.forEach(person => {
      setTimeout(() => {
        this.socket.emit('requestFloor', person.from, person.to);
      }, 1000);
    });
  }
  
  updateUI(initial = false) {
    if (initial) {
      this.startTime = new Date();
      document.getElementById("startTime").innerHTML = this.startTime.toLocaleString();
      return;
    }
    
    this.deliveredCount += 1;
    
    if (this.deliveredCount === this.peopleQueue.length) {
      // emit event to return every elevator to 1st floor
      this.socket.emit('returnToLobby');

      this.finishTime = new Date();
      document.getElementById("finishTime").innerHTML = this.finishTime.toLocaleString();
      document.getElementById("gapTime").innerHTML = getElapsedTime(this.startTime, this.finishTime);
    }
    
    document.getElementById("counter").innerHTML = this.deliveredCount;
  }

  animate(id) {
    const elevator = this.elevators[id]
    elevator.moving = true
    
    // if elevator is at the target floor, stop the animation
    if (Math.abs(elevator.currentFloor - elevator.targetFloor) < 0.1) {
      elevator.currentFloor = elevator.targetFloor;
      this.draw();
      if (elevator.animationId) {
        cancelAnimationFrame(elevator.animationId);
      }
      elevator.moving = false;
      return;
    }

    const direction = Math.sign(elevator.targetFloor - elevator.currentFloor);
    const speed = this.calculateElevatorSpeed(elevator);
    
    elevator.currentFloor += direction * speed;
    
    this.draw();
    elevator.animationId = requestAnimationFrame(() => this.animate(id));
  }

  calculateElevatorSpeed(elevator) {
    const distance = Math.abs(elevator.targetFloor - elevator.currentFloor);
    const baseSpeed = 0.25;
    
    // acceleration and deceleration based on distance to make it feel more natural
    if (distance < 0.5) return baseSpeed * 0.3;
    if (distance < 1) return baseSpeed * 0.5;
    if (distance < 2) return baseSpeed * 0.7;
    if (distance < 3) return baseSpeed * 0.85;
    if (distance < 5) return baseSpeed;
    if (distance < 8) return baseSpeed * 1.2;
    if (distance < 12) return baseSpeed * 1.4;
    if (distance < 16) return baseSpeed * 1.6;
    return baseSpeed * 1.8;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw floors
    this.ctx.fillStyle = 'black';
    for (let i = 0; i < this.totalFloors; i++) {
      const y = this.canvas.height - (i + 1) * this.floorHeight;
      this.ctx.fillText(`Floor ${i+1}`, 10, y + this.floorHeight - 2);

      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
    
    // draw separator line
    this.ctx.beginPath();
    this.ctx.moveTo(110, 0)
    this.ctx.lineTo(110, this.canvas.height)
    this.ctx.stroke();

    // Draw elevator and waiting indicator
    let gapBetween = 0;
    this.elevators.forEach((elevator, id) => {
      if (id > 0) {
        gapBetween = id * 15;
      }
      const xPos = 55 + gapBetween;
      const yPos = this.canvas.height - (elevator.currentFloor + 1) * this.floorHeight;
      
      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(xPos, yPos, this.elevatorWidth, this.elevatorHeight);
      
      // Draw waiting text
      if (elevator.isPickup) {
        this.ctx.fillText('Waiting', 115, this.canvas.height - (elevator.targetFloor * this.floorHeight) - 2);
      }
    });
  }
}

// Initialize elevator animator
const socket = io();
const animators = new ElevatorAnimator({socket, elevatorCount: 3, peopleCount: 100, canvasID: 'elevatorCanvas'});
animators.initializeSocketListeners();
animators.draw();
animators.updateUI(true);
animators.startSimulation();