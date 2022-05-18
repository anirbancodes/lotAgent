const options = {
  method: "GET",
  headers: {
    "X-RapidAPI-Host": "livetime.p.rapidapi.com",
    "X-RapidAPI-Key": "aa4a9e28fdmsh24e8338e2ae0ba7p104b0bjsna4ed2d34bd32",
  },
};
let date, time, hms;

async function fetchTime() {
  let apiData;
  await fetch("https://livetime.p.rapidapi.com/time", options)
    .then((res) => res.json())
    .then((res) => {
      apiData = res;
      time = res.time;
      date = res.date;
      hms = [res.hr, res.min, res.sec, res.ampm];
      console.log("api call");
    })
    .catch((err) => console.error(err));
  return apiData;
}
displayTime();
async function displayTime() {
  await fetchTime();
  document.getElementById("time-counter").innerHTML = time;
  t();
}
async function t() {
  const a = setInterval(() => {
    hms[2]++;
    if (hms[2] > 59) {
      hms[2] = 0;
      hms[1]++;
    }
    if (hms[1] > 59) {
      hms[1] = 0;
      hms[0]++;
    }
    document.getElementById("time-counter").innerHTML =
      hms[0] + ":" + hms[1] + ":" + hms[2];
    setGameDrawTime();
    // console.log(time);
  }, 1000);
  // console.log(time);
}
function setGameDrawTime() {
  let min = hms[1];
  let gameMin = Math.ceil(min / 15) * 15;
  let gameHr = hms[0];
  if (min == 0 || min == 15 || min == 30 || min == 45) gameMin += 15;
  if (gameMin == 60) {
    gameMin = 0;
    gameHr++;
  }
  let drawTime,
    ampm = hms[3];
  if (gameHr < 9 && ampm == "AM") drawTime = "9:0 AM";
  else if (gameHr > 9 && ampm == "PM") drawTime = "9:0 AM";
  else drawTime = gameHr + ":" + gameMin + " " + ampm;

  document.getElementById("draw-date").innerHTML = date;
  document.getElementById("draw-time").innerHTML = drawTime;
  document.getElementById("draw-time2").innerHTML = drawTime;
}

export { fetchTime };
