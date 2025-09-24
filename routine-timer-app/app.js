let currentRoutine = null;
let stageIndex = 0;
let repeatCount = 0;
let timerInterval = null;
let remaining = 0;

const API_BASE = "https://routineworker.itsnatemcm.workers.dev"; 


async function getRoutine(category) {
    const res = await fetch(`${API_BASE}/routine?category=${encodeURIComponent(category)}`);
    const routine = await res.json();
    currentRoutine = routine;
    stageIndex = 0;
    repeatCount = 0;

  document.getElementById("routine").innerHTML = `
    <h2>${routine.fields.Name}</h2>
    <p>${routine.fields.Description || ""}</p>
    <button onclick="startTimer()">Start Timer</button>
  `;
}

function startTimer() {
    if (!currentRoutine) return;
    
    const stages = JSON.parse(currentRoutine.fields.Stages);
    const repeats = Number(currentRoutine.fields.Repeats) || 1; // force number
    console.log(stages, repeats);
    if (repeatCount >= repeats) {
        console.log("Routine complete");
        endRoutine();
        return;
      }
    runStage(stages, repeats);
  }
function runStage(stages, repeats) {
    if (!Array.isArray(stages) || stages.length === 0) {
      endRoutine();
      return;
    }
    if (!repeats || repeats <= 0) repeats = 1; // default safety
  
    if (stageIndex >= stages.length) {
      stageIndex = 0;
      repeatCount++;
      if (repeatCount >= repeats) {
        endRoutine();
        return;
      }
    }
  

  const stage = stages[stageIndex];
  remaining = stage.seconds;

  updateTimer(stage.label);
  console.log(stages,repeats);
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    remaining--;
    updateTimer(stage.label);
    if (remaining <= 0) {
      document.getElementById("bell").play();
      stageIndex++;
      runStage(stages, repeats);
    }
  }, 1000);
}

function updateTimer(label) {
  document.getElementById("timer").innerHTML = `
    <h3>${label}</h3>
    <p>${remaining}s</p>
  `;
}

async function endRoutine() {
    await fetch(`${API_BASE}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: currentRoutine.id })
    });
  }