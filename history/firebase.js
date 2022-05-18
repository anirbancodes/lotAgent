import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

import {
  getDoc,
  doc,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
const firebaseConfig = {
  apiKey: "AIzaSyAVgBu0P69xgUHnZ2Cc4G5IX6gHtb4-MBE",
  authDomain: "qclottery.firebaseapp.com",
  projectId: "qclottery",
  storageBucket: "qclottery.appspot.com",
  messagingSenderId: "650163027647",
  appId: "1:650163027647:web:961de905315b549657500a",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (user) {
    const uid = user.uid;
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
    showUserCredits(data.name, data.credit);
    historyTable(email);
  }
}

function showUserCredits(name, credit) {
  document.getElementById("profile-name").textContent += name;
  document.getElementById("user-credit").textContent = credit;
}
async function historyTable(email, date, match) {
  document.getElementById("sale-table").innerHTML = "";
  document.getElementById("comment-text").innerHTML = "";
  if (!date) {
    let now = new Date();
    let date1 =
      now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    date = date1;
  }
  if (!match) {
    match = "9:0 AM";
  }
  const ref = doc(db, "agents", email, "offline", "lotto", "games", date);

  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    const game = docSnap.data()[match];
    console.log(game);
    if (game) {
      for (let i = 0; i < 10; i++) {
        let rowData = "";
        if (!game[i]) continue;

        rowData +=
          ` <div class="line white-card">
          <p class="number">` +
          i +
          `</p>
          <p style="margin-left: 20px">`;
        let amtS = "";
        let keys = Object.keys(game[i]);
        keys.forEach((scrip) => {
          amtS += game[i][scrip].amt + "+";
        });
        rowData +=
          amtS +
          `</p>
          </div>
          
        </div>`;
        document.getElementById("sale-table").innerHTML += rowData;
      }
    } else {
      document.getElementById("comment-text").innerHTML =
        "No history for " + date + " " + match;
    }
  }
}
const showBtn = document.getElementById("showBtn");
showBtn.addEventListener("click", () => {
  let date = document.getElementById("date").value;
  let match = document.getElementById("history-match").value;
  console.log(match);
  let i1 = date.indexOf("-"),
    i2 = date.lastIndexOf("-");
  date =
    date.substring(0, i1 + 1) +
    (Number(date.substring(i1 + 1, i2)) / 10) * 10 +
    "-" +
    (Number(date.substring(i2 + 1, i2 + 3)) / 10) * 10;
  historyTable(auth.currentUser.email, date, match);
});
