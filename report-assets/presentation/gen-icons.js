const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const fa = require("react-icons/fa");
const fi = require("react-icons/fi");

const OUT = path.join(__dirname, "assets");
fs.mkdirSync(OUT, { recursive: true });

const ICONS = [
  // testing types
  { name: "unit", Icon: fa.FaFlask, color: "FFFFFF" },
  { name: "controlflow", Icon: fa.FaProjectDiagram, color: "FFFFFF" },
  { name: "dataflow", Icon: fa.FaDatabase, color: "FFFFFF" },
  { name: "domain", Icon: fa.FaBullseye, color: "FFFFFF" },
  { name: "integration", Icon: fa.FaLink, color: "FFFFFF" },
  { name: "access", Icon: fa.FaUserShield, color: "FFFFFF" },
  // tech stack
  { name: "react", Icon: fa.FaReact, color: "1B2A4A" },
  { name: "node", Icon: fa.FaNodeJs, color: "1B2A4A" },
  { name: "database", Icon: fa.FaDatabase, color: "1B2A4A" },
  // roles
  { name: "student", Icon: fa.FaUserGraduate, color: "FFFFFF" },
  { name: "staff", Icon: fa.FaUserTie, color: "FFFFFF" },
  { name: "admin", Icon: fa.FaUserCog, color: "FFFFFF" },
  // misc
  { name: "check", Icon: fa.FaCheckCircle, color: "E8A33D" },
  { name: "checkwhite", Icon: fa.FaCheckCircle, color: "FFFFFF" },
  { name: "bug", Icon: fa.FaBug, color: "FFFFFF" },
  { name: "tag", Icon: fa.FaTag, color: "E8A33D" },
  { name: "arrow", Icon: fi.FiArrowRight, color: "1B2A4A" },
  { name: "arrowwhite", Icon: fi.FiArrowRight, color: "FFFFFF" },
  { name: "shield", Icon: fa.FaShieldAlt, color: "FFFFFF" },
  { name: "lightbulb", Icon: fa.FaLightbulb, color: "E8A33D" },
];

async function run() {
  for (const { name, Icon, color } of ICONS) {
    const svgMarkup = ReactDOMServer.renderToStaticMarkup(
      React.createElement(Icon, { color: `#${color}`, size: 512 })
    );
    const outPath = path.join(OUT, `${name}.png`);
    await sharp(Buffer.from(svgMarkup), { density: 384 }).resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(outPath);
    console.log("wrote", outPath);
  }
}

run();
