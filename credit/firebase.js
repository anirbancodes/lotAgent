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
//import { fetchTime } from "./index.js";
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
    showUserCredits(data.name, data.credit);
    let now = new Date();
    let date =
      now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    historyTable(email, date);
  }
}
//displayTime();
async function displayTime() {
  await fetchTime();
  document.getElementById("time-counter").innerHTML = time;
  // t();
}
function showUserCredits(name, credit) {
  document.getElementById("profile-name").textContent += name;
  document.getElementById("user-credit").textContent = credit;
}
async function historyTable(email, date) {
  const ref = doc(db, "agents", email, "offline", "lotto", "credits", date);

  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    const credits = docSnap.data().cred;
    document.getElementById("credit-table").innerHTML = `<div class="line">
    <p class="number">Time</p>
    <p class="number" style="margin-left: 20px">
      &emsp;&emsp;&emsp;&emsp;&emsp;Amt
    </p>
  </div>`;
    credits.forEach((trans) => {
      document.getElementById("credit-table").innerHTML +=
        `  <div class="line">
        <p class="number">` +
        trans.time +
        `</p>
        <p class="number" style="margin-left: 20px">:&emsp; ` +
        trans.amt +
        `</p>
      </div>`;
    });
  }
}
const showBtn = document.getElementById("showBtn");
showBtn.addEventListener("click", () => {
  let date = document.getElementById("date").value;
  let i1 = date.indexOf("-"),
    i2 = date.lastIndexOf("-");
  date =
    date.substring(0, i1 + 1) +
    (Number(date.substring(i1 + 1, i2)) / 10) * 10 +
    "-" +
    (Number(date.substring(i2 + 1, i2 + 3)) / 10) * 10;
  if (!date) {
    let now = new Date();
    let date1 =
      now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    date = date1;
  }

  historyTable(auth.currentUser.email, date);
});
