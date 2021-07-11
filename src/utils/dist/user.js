"use strict";
exports.__esModule = true;
exports.randomEmoji = void 0;
function randomEmoji(size) {
  if (size === void 0) {
    size = 100;
  }
  var emojis = ["😂", "🥺", "😊", "🥰", "😃", "🤩", "🤔", "😏", "😷"];
  var emoji = emojis[Math.floor(Math.random() * emojis.length)];
  return (
    "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 " +
    size +
    " " +
    size +
    "%22><text x=%22" +
    size / 2 +
    "%22 y=%22" +
    (size / 100) * 60 +
    "%22 alignment-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%22" +
    (size / 100) * 70 +
    "%22>" +
    emoji +
    "</text></svg>"
  );
}
exports.randomEmoji = randomEmoji;
