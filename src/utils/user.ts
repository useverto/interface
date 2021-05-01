export function randomEmoji() {
  const emojis = ["😂", "🥺", "😊", "🥰", "😃", "🤩", "🤔", "😏", "😷"];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  return `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text x=%2250%22 y=%2260%22 alignment-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2270%22>${emoji}</text></svg>`;
}
