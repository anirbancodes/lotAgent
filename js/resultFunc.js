//no. with lowest bet amount & max people wins
const amt = {
  0: [10, 2],
  1: [1100, 25],
  2: [1200, 38],
  3: [40, 4],
  4: [8000, 100],
  5: [965, 5],
  6: [300, 15],
  7: [990, 33],
  8: [975, 15],
  9: [100, 10],
};
const totBetAmt = 14000;
const minAmt = 2;
const maxPeople = [4, 2, 1, 7, 6, 8, 9, 5, 3, 0]; //sorted in decreasing
const marginP = 40; //in %
const marginAmt = (totBetAmt * (100 - marginP)) / 100;
const marginErrorP = 10,
  peopleErrorP = 10; // in %

// 5x
let winner2,
  c = 0;
let winner1 = minAmt;
for (let i = 0; i < 10; i++) {
  const no = maxPeople[i];
  const noAmt = amt[no][0];
  //check if we can afford
  const rewardAmt = noAmt * 5; //5x
  if (rewardAmt <= marginAmt * (1 + marginErrorP / 100)) {
    if (c >= 2) break;
    if (c == 0) winner1 = no;
    if (c == 1) winner2 = no;
    c++;
  }
}
let winner = winner1;
if (
  amt[winner1][0] * (1 + marginErrorP / 100) <= amt[winner2][0] &&
  amt[winner1][1] * (1 + peopleErrorP / 100) <= amt[winner2][1]
) {
  winner = winner2;
}

console.log(winner);
