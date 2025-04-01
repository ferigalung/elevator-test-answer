const canvas = document.getElementById('elevatorCanvas');
const ctx = canvas.getContext('2d');
const elevatorInput = document.getElementById('elevatorInput');
const floorInput = document.getElementById('floorInput');
const requestButton = document.getElementById('requestButton');

const totalFloors = 50;
const floorHeight = 14; 
const elevatorWidth = 10;
const elevatorHeight = 13;

let elevators = [
  {
    currentFloor: 0,
    previousFloor: 0,
    targetFloor: 0,
    animationId: null,
    state: 0,
  },
  {
    currentFloor: 0,
    previousFloor: 0,
    targetFloor: 0,
    animationId: null,
    state: 0,
  },
  {
    currentFloor: 0,
    previousFloor: 0,
    targetFloor: 0,
    animationId: null,
    state: 0,
  }
];

let startTime = new Date();
let finishTime;

let deliveredCount = 0;
let timeNeeded = 0;

updateDeliverCount();

function drawElevator() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw floors and floor numbers
  ctx.fillStyle = 'black';
  for (let i = 0; i < totalFloors; i++) {
    const yPosition = canvas.height - (i + 1) * floorHeight;
    ctx.fillText(`Floor ${i+1}`, 10, yPosition + floorHeight - 2);
    
    ctx.beginPath();
    ctx.moveTo(0, yPosition);
    ctx.lineTo(canvas.width, yPosition);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(110, yPosition)
    ctx.lineTo(110, yPosition+canvas.height)
    ctx.stroke();
  }

  let gapBetween = 0;

  for (let idx = 0; idx < elevators.length; idx++) {
    if (idx > 0) {
      gapBetween = idx * 15;
    }
    const pos = 55 + gapBetween;
    const obj = elevators[idx]
    drawElevatorBox(pos,canvas.height - (obj.currentFloor + 1) * floorHeight + (floorHeight - elevatorHeight), elevatorWidth, elevatorHeight)
  
    ctx.fillText('Waiting', 115, (obj.targetFloor - 1) * floorHeight);
    ctx.stroke()
  }
}

function drawElevatorBox(xPos, yPos, wVal, hVal) {
  ctx.fillStyle = 'red';
  ctx.fillRect(xPos, yPos, wVal, hVal);
}

function animateElevator(idx, cb) {
  const obj = elevators[idx];

  obj.state = 1;

  if (obj.currentFloor < obj.targetFloor) {
    let gap = obj.targetFloor - obj.currentFloor;
    let inLinear = parseInt(obj.targetFloor / 5)
    if (gap < 5) {
      obj.currentFloor += 0.1;
    } else if (obj.currentFloor === 0 && obj.currentFloor <= inLinear) {
      obj.currentFloor += 0.1
    } else if (obj.currentFloor > 0 && (obj.currentFloor - 5) < inLinear) {
      obj.currentFloor += 0.1;
    } else {
      obj.currentFloor += 0.2;
    }
    if (obj.currentFloor > obj.targetFloor) obj.currentFloor = obj.targetFloor;
  } else if (obj.currentFloor > obj.targetFloor) {
    let gap = (obj.currentFloor - obj.targetFloor)
    if (obj.previousFloor > 0) {
      let inLinear = parseInt(obj.previousFloor/ 5)
      if (gap < 5) {
        obj.currentFloor -= 0.1;
      } else if (obj.currentFloor > parseInt(inLinear * 5)) {
        obj.currentFloor -= 0.1;
      } else {
        obj.currentFloor -= 0.2;
      }
    } else {
      if (gap < 5) {
        obj.currentFloor -= 0.1;
      } else {
        obj.currentFloor -= 0.2;
      }
    }

    if (obj.currentFloor < obj.targetFloor) {
       obj.currentFloor = obj.targetFloor;
    }
  }
  
  drawElevator();

  if (obj.currentFloor !== obj.targetFloor) {
    obj.animationId = requestAnimationFrame(eval('animateElevator'+(idx+1)));
  } else {
    obj.previousFloor = obj.currentFloor;
    cancelAnimationFrame(obj.animationId);

    obj.state = 0;
    if (typeof cb === 'function') cb(obj);
  }
}

function updateDeliverCount(v) {
  if (v !== undefined && v > 0) {
    deliveredCount += v;
  }
  document.getElementById("startTime").innerHTML = startTime.toLocaleString();
  
  if (finishTime) {
    document.getElementById("finishTime").innerHTML = finishTime.toLocaleString();
    document.getElementById("gapTime").innerHTML = getDateTimeSince(startTime);
  }

  document.getElementById("counter").innerHTML = deliveredCount;
}

drawElevator(0, 0);
drawElevator(1, 0);
drawElevator(2, 0);

let elvParams1 = [];
function setElevatorParams1() {
  elvParams1 = arguments;
}
function getElevatorParams1(){
  return elvParams1;
}
function clearElevatorParams1() {
  elvParams1 = [];
}

let elvParams2 = [];
function setElevatorParams2() {
  elvParams2 = arguments;
}
function getElevatorParams2(){
  return elvParams2;
}
function clearElevatorParams2() {
  elvParams2 = [];
}

let elvParams3 = [];
function setElevatorParams3() {
  elvParams3 = arguments;
}
function getElevatorParams3(){
  return elvParams3;
}
function clearElevatorParams3() {
  elvParams3 = [];
}

function animateElevator1(){
  animateElevator.apply(null, [0, ...getElevatorParams1()])
}
function animateElevator2(){
  animateElevator.apply(null, [1, ...getElevatorParams2()])
}
function animateElevator3(){
  animateElevator.apply(null, [2, ...getElevatorParams3()])
}

function mapSetIdxToElevator(idx, params) {
  if (idx === 2) {
    setElevatorParams3.apply(null, params)
  }

  if (idx === 1) {
    setElevatorParams2.apply(null, params)
  }

  if (idx === 0) {
    setElevatorParams1.apply(null, params)
  }
}

function mapClearParamsIdxElevator(idx) {
  if (idx === 2) {
    clearElevatorParams3()
  }

  if (idx === 1) {
    clearElevatorParams2()
  }

  if (idx === 0) {
    clearElevatorParams1()
  }
}

function mapCallIdxToElevator(idx) {
  if (idx === 2) {
    animateElevator3()
  }

  if (idx === 1) {
    animateElevator2()
  }

  if (idx === 0) {
    animateElevator1()
  }
}

function go(idx, man, cb) {
  const elv = elevators[idx];
    elv.targetFloor = man.from - 1;
    mapSetIdxToElevator(idx, [function(elv) {

      setTimeout(function(){
        elv.targetFloor = man.to - 1;
        mapClearParamsIdxElevator(idx);
        mapSetIdxToElevator(idx, [function(el){
          if ((man.to - 1) == el.currentFloor) {
            updateDeliverCount(1)
          }

          // next
          if (typeof cb === 'function') {
            setTimeout(cb, 2000);
          }
        }])
        mapCallIdxToElevator(idx);
      }, 2000)
    }]);

    mapCallIdxToElevator(idx);
}

function getNextElevator(idx) {
  if (idx === 2) return 0;
  return idx + 1;
}

function getMan(idx) {
  if (idx === mans.length) return null;
  return mans[idx];
}

function run(elvIdx, row) {
  if (row == mans.length) return;
  const m = getMan(row);
  go(elvIdx, m, function(){
    const m2 = getMan(row+1);
    if (m2 != null) {
      return run(getNextElevator(elvIdx), row+1)
    } 

    finishTime = new Date();
    updateDeliverCount();
  })
}

run(0, 0)

