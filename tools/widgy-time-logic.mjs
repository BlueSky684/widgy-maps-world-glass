// Local device time. These scripts perform no network requests.
export function greetingAt(date) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'MORNING';
  if (hour >= 12 && hour < 17) return 'AFTERNOON';
  if (hour >= 17 && hour < 22) return 'EVENING';
  return 'NIGHT';
}

export function dayPercentAt(date) {
  const elapsed = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return Math.floor(elapsed * 100 / 86400);
}

export const greetingScript = `function main() {\n  var hour = new Date().getHours();\n  if (hour >= 5 && hour < 12) return "MORNING";\n  if (hour >= 12 && hour < 17) return "AFTERNOON";\n  if (hour >= 17 && hour < 22) return "EVENING";\n  return "NIGHT";\n}`;

export const dayPercentScript = `function main() {\n  var now = new Date();\n  var elapsed = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();\n  return Math.floor(elapsed * 100 / 86400);\n}`;
