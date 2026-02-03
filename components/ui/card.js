export function Card(children, className = "") {
  const div = document.createElement("div");
  div.className = `card ${className}`;
  div.appendChild(children);
  return div;
}

export function CardContent(children, className = "") {
  const div = document.createElement("div");
  div.className = className;
  div.appendChild(children);
  return div;
}
