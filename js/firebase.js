import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { fc } from "/js/c.js";
import {
  getDoc,
  doc,
  arrayUnion,
  runTransaction,
  increment,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import { fetchTime } from "./index.js";

const app = initializeApp(fc);
const db = getFirestore(app);
const auth = getAuth();

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener("click", (e) => {
  signOut(auth)
    .then(() => {
      //logout
    })
    .catch((error) => {
      alert(error);
    });
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
    //showUserEmail(user.email);
    loadUserData(user.email);
  } else {
    window.location = "/pages/login.html";
  }
});

async function loadUserData(email) {
  const ref = doc(db, "agents", email);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    let data = docSnap.data();
    if (data.active == false) activateAgent(email, data.name);

    showUserCredits(data.name, data.credit);
    showDrawTbody(email);
  }
}

function showUserCredits(name, credit) {
  document.getElementById("profile-name").textContent = name;
  document.getElementById("user-credit").textContent = credit;
}

async function calcDrawTime() {
  const t22 = await fetchTime();
  let date = t22.date,
    time = t22.time,
    min = t22.min,
    gameHr = t22.hr,
    sec = t22.sec,
    ampm = t22.ampm;
  let gameMin = Math.ceil(min / 15) * 15;
  if (min == 0 || min == 15 || min == 30 || min == 45) gameMin += 15;
  if (gameMin == 60 && gameHr != 12) {
    gameMin = 0;
    gameHr++;
  } else if (gameMin == 60 && gameHr == 12) {
    gameMin = 0;
    gameHr = 1;
  }
  let drawTime;
  if (gameHr == 12 && gameMin == 0) {
    if (ampm == "AM") ampm = "PM";
    else if (ampm == "PM") ampm = "AM";
  }
  // if (gameHr < 9 && ampm == "AM") drawTime = "9:0 AM";
  // else if (
  //   (gameHr > 9 && ampm == "PM" && gameHr != 12) ||
  //   (gameHr == 9 && gameMin > 0 && ampm == "PM" && gameHr != 12)
  // )
  if (
    (gameHr < 9 && ampm == "AM") ||
    //gameHr >= 9 && gameMin > 0 && ampm == "PM" && gameHr != 12
    (gameHr > 9 && ampm == "PM" && gameHr != 12) ||
    (gameHr == 9 && gameMin > 0 && ampm == "PM" && gameHr != 12) ||
    (gameHr == 12 && //&& gameMin > 0
      ampm == "AM")
  )
    drawTime = "9:0 AM";
  else drawTime = gameHr + ":" + gameMin + " " + ampm;
  return { date, drawTime, time, gameMin, gameHr, ampm, min, sec };
}

async function showDrawTbody(email) {
  const { date, drawTime } = await calcDrawTime();
  const ref = doc(db, "agents", email, "offline", "lotto", "games", date);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    let gameData = docSnap.data()[drawTime];
    drawTbody(gameData);
  }
}

function drawTbody(data) {
  document.getElementById("game-draw-tbody").innerHTML = "";
  let keys = Object.keys(data);
  keys.forEach((i) => {
    let rowData = "";
    let ndata = data[i];
    rowData +=
      `<tr class="white-card">
    <td><strong>` +
      i +
      `</strong></td>
    <td><span style="margin-left: 20px">`;

    if (ndata != undefined) {
      ndata.forEach((n) => {
        rowData += n.amt + " + ";
      });
    }
    document.getElementById("game-draw-tbody").innerHTML +=
      rowData + `</span></td></tr>`;
  });
}

let betClicked = false;
async function play(email, number, amount) {
  betClicked = true;
  const ref = doc(db, "agents", email, "offline", "lotto");
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    let data = docSnap.data();
    if (amount <= data.credit) {
      const { date, drawTime, time, gameMin, gameHr, ampm, min, sec } =
        await calcDrawTime();
      if (
        (gameHr > 9 && ampm == "PM" && gameHr != 12) ||
        (gameHr == 9 && gameMin > 0 && ampm == "PM" && gameHr != 12) ||
        (gameHr == 12 && ampm == "AM")
      ) {
        alert("Game Closed");
        betClicked = false;
        return;
      }
      if (
        (min % 10 == 59 && sec >= 45) ||
        (min % 10 == 14 && sec >= 45) ||
        (min % 10 == 29 && sec >= 45) ||
        (min % 10 == 44 && sec >= 45)
      ) {
        alert("Time UP");
        window.location = "/";
        return;
      }
      try {
        await runTransaction(db, async (transaction) => {
          const dEmail = (
            await transaction.get(doc(db, "agents", email))
          ).data().dEmail;
          const gamesDateDoc = await transaction.get(doc(db, "games", date));
          const gamesDealerDoc = await transaction.get(
            doc(db, "agents", email, "offline", "lotto", "games", date)
          );
          const agentSaleDoc = await transaction.get(
            doc(db, "dealers", dEmail, "agentsale", date)
          );
          if (!gamesDateDoc.exists()) {
            transaction.set(doc(db, "games", date), {});
          }
          if (!gamesDealerDoc.exists()) {
            transaction.set(
              doc(db, "agents", email, "offline", "lotto", "games", date),
              {}
            );

            transaction.set(
              doc(db, "agents", email, "offline", "lotto", "sale", date),
              {}
            );
          }

          if (!agentSaleDoc.exists()) {
            transaction.set(doc(db, "dealers", dEmail, "agentsale", date), {});
          }
          transaction.update(
            doc(db, "dealers", dEmail, "agentsale", date),
            {
              sale: increment(amount),
            },
            { merge: true }
          );
          transaction.update(
            doc(db, "games", date),
            {
              [`${drawTime}.${number}`]: arrayUnion({
                amt: amount,
                t: "a",
                time: time + " " + ampm,
                email: email,
              }),
            },
            { merge: true }
          );
          transaction.update(doc(db, "agents", email, "offline", "lotto"), {
            credit: increment(-1 * amount),
            totPlay: increment(amount),
          });
          transaction.update(doc(db, "agents", email), {
            credit: increment(-1 * amount),
          });
          transaction.update(
            doc(db, "agents", email, "offline", "lotto", "games", date),
            {
              [`${drawTime}.${number}`]: arrayUnion({
                time: time + " " + ampm,
                amt: amount,
              }),
            },
            { merge: true }
          );
          transaction.update(
            doc(db, "agents", email, "offline", "lotto", "sale", date),
            {
              [`${drawTime}`]: increment(Number(amount)),
            },
            { merge: true }
          );
        });
      } catch (e) {
        console.error(e);
        alert("Failed: ", e);
      }
      betClicked = false;
      //window.location = "/";
      document.getElementById("bet-amt").value = 0;
      await showDrawTbody(email);
    } else {
      alert(`Not enough credits`);
    }
  }
}

const btn = document.getElementById("btn-submit");
btn.addEventListener("click", async (e) => {
  if (betClicked === true) return;

  const bet_amt = Number(document.getElementById("bet-amt").value);
  let bet_no;
  let ele = document.getElementsByName("scrip");
  for (let i = 0; i < ele.length; i++) {
    if (ele[i].checked) bet_no = ele[i].value;
  }
  if (bet_amt >= 10) {
    const email = auth.currentUser.email;
    await play(email, bet_no, bet_amt, false);
    const ref = doc(db, "agents", email);
    const docSnap = await getDoc(ref);
    if (docSnap.exists()) {
      let data = docSnap.data();
      showUserCredits(data.name, data.credit);
    }
  } else {
    alert("10 credits required");
    //betClicked = false;
  }
});

const addBulkBtn = document.getElementById("btn-submit-bulk");
const bulkFunc = async () => {
  console.log("clicked");
  addBulkBtn.removeEventListener("click", bulkFunc);
  let nx = 0;
  const email = auth.currentUser.email;
  for (let k = 1; k < 5; k++) {
    let scrip = Number(document.getElementById(`bulk` + k + `-scrip`).value);
    let amt = Number(document.getElementById(`bulk` + k + `-amt`).value);
    if (amt < 10) continue;
    await play(email, scrip, amt);
    nx++;
    document.getElementById(`bulk` + k + `-amt`).value = 0;
  }
  alert(`placed ${nx} orders`);
  const ref = doc(db, "dealers", email);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    let data = docSnap.data();
    showUserCredits(data.name, data.credit);
  }
  addBulkBtn.addEventListener("click", bulkFunc);
};
addBulkBtn.addEventListener("click", bulkFunc);

async function activateAgent(email, name) {
  try {
    await runTransaction(db, async (transaction) => {
      transaction.update(doc(db, "agents", email), {
        active: true,
      });
      transaction.set(doc(db, "agents", email, "credits", "0"), {});

      transaction.set(doc(db, "agents", email, "offline", "lotto"), {
        credit: 0,
        name: name,
        totPlay: 0,
      });

      transaction.set(
        doc(db, "agents", email, "offline", "lotto", "credits", "0"),
        {}
      );

      transaction.set(
        doc(db, "agents", email, "offline", "lotto", "games", "0"),
        {}
      );

      transaction.set(
        doc(db, "agents", email, "offline", "lotto", "sale", "0"),
        {}
      );

      console.log("Agent Doc created");
    });
  } catch (e) {
    alert("Activation failed");
    console.error(e);
  }
}

const dtimes = [
  "9:0 PM",
  "8:45 PM",
  "8:30 PM",
  "8:15 PM",
  "8:0 PM",
  "7:45 PM",
  "7:30 PM",
  "7:15 PM",
  "7:0 PM",
  "6:45 PM",
  "6:30 PM",
  "6:15 PM",
  "6:0 PM",
  "5:45 PM",
  "5:30 PM",
  "5:15 PM",
  "5:0 PM",
  "4:45 PM",
  "4:30 PM",
  "4:15 PM",
  "4:0 PM",
  "3:45 PM",
  "3:30 PM",
  "3:15 PM",
  "3:0 PM",
  "2:45 PM",
  "2:30 PM",
  "2:15 PM",
  "2:0 PM",
  "1:45 PM",
  "1:30 PM",
  "1:15 PM",
  "1:0 PM",
  "12:45 PM",
  "12:30 PM",
  "12:15 PM",
  "12:0 PM",
  "11:45 AM",
  "11:30 AM",
  "11:15 AM",
  "11:0 AM",
  "10:45 AM",
  "10:30 AM",
  "10:15 AM",
  "10:0 AM",
  "9:45 AM",
  "9:30 AM",
  "9:15 AM",
  "9:0 AM",
];

async function saleTbody() {
  // const apiObj = fetchTime;
  let date = fetchTime.date; //,apiTime = fetchTime.time;
  if (!date) {
    let now = new Date();
    let date1 =
      now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    date = date1;
  }
  // if (date == apiDate) {
  //   //today
  // }
  // document.getElementById("today").innerHTML = date;
  const ref = doc(db, "result", date);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    const result = docSnap.data();
    document.getElementById(
      "sale-tbody"
    ).innerHTML = `<li class="table-header li">
            <div class="col2">Time</div>
            <div class="col2">Lucky No.</div>
          </li>`;
    // let keys = Object.keys(result);
    // keys.forEach((dtime) => {
    dtimes.forEach((dtime) => {
      if (result[dtime] != undefined || result[dtime] != null)
        document.getElementById("sale-tbody").innerHTML +=
          `<li class="table-row li">
      <div class="col2">` +
          dtime +
          `</div>
      <div class="col2 or2" ><strong>` +
          result[dtime] +
          `</strong></div>
    </li>`;
    });
  } else {
    document.getElementById("sale-tbody").innerHTML = "No Permission";
  }
}
saleTbody();
const refreshResBtn = document.getElementById("refreshResBtn");
refreshResBtn.addEventListener("click", () => {
  let date = document.getElementById("date").value;
  if (date) {
    let i1 = date.indexOf("-"),
      i2 = date.lastIndexOf("-");
    date =
      date.substring(0, i1 + 1) +
      (Number(date.substring(i1 + 1, i2)) / 10) * 10 +
      "-" +
      (Number(date.substring(i2 + 1, i2 + 3)) / 10) * 10;
  } else if (!date) {
    let now = new Date();
    date = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
  }
  saleTbody(date);
});
