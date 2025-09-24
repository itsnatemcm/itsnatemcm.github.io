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
    const repeats = Int(currentRoutine.fields.Repeats);
    console.log(stages, repeats);
    if (repeatCount >= repeats) {
        console.log("Routine complete");
        endRoutine();
        return;
      }
    runStage(stages, repeats);
  }
  function runStage(stages, repeats) {
    // Safety checks
    if (!Array.isArray(stages) || stages.length === 0) {
      console.error("No stages provided");
      endRoutine();
      return;
    }
  
    // Always treat repeats as a positive integer
    repeats = Number(repeats) || 1;
  
    // Reset counters if starting fresh
    if (typeof stageIndex === "undefined") stageIndex = 0;
    if (typeof remaining === "undefined") remaining = 0;
  
    // If all repeats are finished → stop
    if (repeats <= 0) {
      endRoutine();
      return;
    }
  
    // If we’ve run out of stages → start next repeat
    if (stageIndex >= stages.length) {
      stageIndex = 0;
      repeats--; // 🔑 decrease repeat count
      console.log(`New repeat, ${repeats} left`);
      runStage(stages, repeats);
      return;
    }
  
    // Current stage
    const stage = stages[stageIndex];
    remaining = Number(stage.seconds) || 0;
    if (remaining <= 0) {
      console.error("Invalid stage duration:", stage);
      stageIndex++;
      runStage(stages, repeats);
      return;
    }
  
    updateTimer(`${stage.label} (${repeats} repeats left)`);
    console.log(`Stage ${stageIndex + 1}/${stages.length}, ${repeats} repeats left`);
  
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      remaining--;
      updateTimer(`${stage.label} (${repeats} repeats left)`);
  
      if (remaining <= 0) {
        clearInterval(timerInterval);
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