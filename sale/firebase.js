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
    saleTbody(email);
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
async function saleTbody(email, date) {
  if (!date) {
    let now = new Date();
    let date1 =
      now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
    date = date1;
  }
  const ref = doc(db, "agents", email, "offline", "lotto", "sale", date);
  const docSnap = await getDoc(ref);
  if (docSnap.exists()) {
    const sale = docSnap.data();
    if (!sale) {
      document.getElementById("dayTotSale").innerHTML = "No sale on " + date;
    } else {
      document.getElementById(
        "sale-tbody"
      ).innerHTML = `<li class="table-header">
            <div class="col">Match</div>
            <div class="col">Sale</div>
          </li>`;
      let totsale = 0;
      let keys = Object.keys(sale);
      keys.forEach((dtime) => {
        totsale += sale[dtime];
        document.getElementById("sale-tbody").innerHTML +=
          `<li class="table-row">
      <div class="col" data-label="Job Id">` +
          dtime +
          `</div>
      <div class="col" data-label="Customer Name" >` +
          sale[dtime] +
          `</div>
    </li>`;
      });
      document.getElementById("dayTotSale").innerHTML = totsale;
    }
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
  console.log(date);
  saleTbody(auth.currentUser.email, date);
});
