import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const projectSource = "G:\\My Drive\\Website Source Material\\Custom Projects";
const workshopSource = "G:\\My Drive\\Website Source Material\\ShopPhotos";
const projectOutput = path.join(root, "assets", "images", "custom-projects");
const workshopOutput = path.join(root, "assets", "images", "workshop");

const slugify = (value) => value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const readPngDimensions = (buffer) => {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
};

const readJpegDimensions = (buffer) => {
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    const length = buffer.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
};

const dimensionsFor = async (file) => {
  const buffer = await readFile(file);
  return readPngDimensions(buffer) || readJpegDimensions(buffer) || { width: 1200, height: 900 };
};

const sectionValue = (text, heading) => {
  const pattern = new RegExp(`${heading}:\\s*\\r?\\n([\\s\\S]*?)(?=\\r?\\n[A-Z][A-Z /-]+:|\\r?\\nPROJECT:|$)`, "i");
  return text.match(pattern)?.[1].trim() || "";
};

const parseGallery = (text) => {
  const galleryText = text.match(/GALLERY:\s*([\s\S]*?)(?=\r?\nIMAGE DISCLOSURE:|$)/i)?.[1] || "";
  const entryPattern = /^[ \t]*(\d{2}-[^\r\n]+)\r?\nLABEL:\s*([^\r\n]+)\r?\nCAPTION:\s*\r?\n([\s\S]*?)(?=^[ \t]*\d{2}-|^[A-Z][A-Z /-]+:|(?![\s\S]))/gm;
  return [...galleryText.matchAll(entryPattern)].map((match) => ({
    fileName: match[1].trim(),
    label: match[2].trim(),
    caption: match[3].trim().replace(/\s+/g, " ")
  }));
};

const badgeFor = ({ label = "", caption = "" }) => {
  const text = `${label} ${caption}`.toLowerCase();
  if (/finished|complete|installed|original finished|made by kennedy/.test(text)) return "FINISHED PROJECT";
  if (/customer|source artwork|reference|inspiration|ai-generated/.test(text)) return "CUSTOMER-SUPPLIED REFERENCE";
  if (/progress|production|assembly|construction|raw|bare|painting|design|layout|nearly/.test(text)) return "IN PROGRESS";
  return "";
};

const altFor = (project, image) => {
  if (image.category === "CUSTOMER-SUPPLIED REFERENCE") return `${project.title} customer-supplied reference: ${image.caption}`;
  return `${project.title} ${image.label}: ${image.caption}`;
};

const findImageFile = (available, requested) => {
  if (available.has(requested)) return requested;
  const number = requested.match(/^(\d{2})-/)?.[1];
  if (!number) return "";
  return [...available].find((file) => file.startsWith(`${number}-`) && /\.(jpe?g|png)$/i.test(file)) || "";
};

await mkdir(projectOutput, { recursive: true });
await mkdir(workshopOutput, { recursive: true });

const folders = (await readdir(projectSource, { withFileTypes: true })).filter((entry) => entry.isDirectory() && entry.name !== "Archive");
const projects = [];

for (const folder of folders) {
  const sourceDir = path.join(projectSource, folder.name);
  const info = await readFile(path.join(sourceDir, "project-info.txt"), "utf8");
  const title = info.match(/^PROJECT:\s*(.+)$/m)?.[1].trim() || folder.name;
  const type = sectionValue(info, "PROJECT TYPE").replace(/\s+/g, " ");
  const description = sectionValue(info, "PROJECT DESCRIPTION").split(/\r?\n\s*\r?\n/).map((part) => part.trim().replace(/\s+/g, " ")).filter(Boolean);
  const gallery = parseGallery(info);
  const available = new Set((await readdir(sourceDir, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => entry.name));
  const slug = slugify(title);
  const explicitHero = info.match(/^HERO IMAGE:\s*(.+)$/m)?.[1].trim();
  const heroFile = explicitHero || gallery.find((image) => /hero/i.test(image.fileName))?.fileName || gallery[0]?.fileName;
  const disclosure = sectionValue(info, "IMAGE DISCLOSURE").replace(/\s+/g, " ");
  const images = [];

  for (const image of gallery) {
    const matchedFile = findImageFile(available, image.fileName);
    if (!matchedFile) continue;
    const extension = path.extname(matchedFile).toLowerCase();
    const baseName = path.basename(matchedFile, extension);
    const outputName = `${slug}-${baseName}${extension}`;
    const sourcePath = path.join(sourceDir, matchedFile);
    const outputPath = path.join(projectOutput, outputName);
    await copyFile(sourcePath, outputPath);
    const size = await dimensionsFor(sourcePath);
    const category = badgeFor(image);
    images.push({
      src: `assets/images/custom-projects/${outputName}`,
      fallback: `assets/images/custom-projects/${outputName}`,
      alt: "",
      width: size.width,
      height: size.height,
      label: image.label,
      caption: image.caption,
      category
    });
  }

  const project = {
    id: slug,
    title,
    type,
    description,
    heroImage: images.find((image) => image.src.includes(path.basename(heroFile || "", path.extname(heroFile || ""))))?.src || images.find((image) => /hero/i.test(image.src))?.src || images[0]?.src,
    disclosure,
    images
  };
  const heroMeta = !explicitHero ? gallery.find((image) => /hero/i.test(image.fileName)) : null;
  const heroOutput = !explicitHero ? project.images.find((image) => /hero/i.test(image.src)) : null;
  if (heroMeta && heroOutput) {
    heroOutput.label = heroMeta.label;
    heroOutput.caption = heroMeta.caption;
    heroOutput.category = badgeFor(heroMeta);
  }
  const comparisonMeta = gallery.find((image) => /reference-vs-finished/i.test(image.fileName));
  const comparisonOutput = project.images.find((image) => /reference-vs-finished/i.test(image.src));
  if (comparisonMeta && comparisonOutput) {
    comparisonOutput.label = comparisonMeta.label;
    comparisonOutput.caption = comparisonMeta.caption;
    comparisonOutput.category = badgeFor(comparisonMeta);
  }
  project.images.forEach((image) => { image.alt = altFor(project, image); });
  projects.push(project);
}

const workshopImages = [];
for (const file of (await readdir(workshopSource, { withFileTypes: true })).filter((entry) => entry.isFile() && /\.(jpe?g|png)$/i.test(entry.name)).sort((a, b) => a.name.localeCompare(b.name))) {
  const sourcePath = path.join(workshopSource, file.name);
  const outputName = `klw-workshop-${path.parse(file.name).name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}${path.extname(file.name).toLowerCase()}`;
  const outputPath = path.join(workshopOutput, outputName);
  await copyFile(sourcePath, outputPath);
  const size = await dimensionsFor(sourcePath);
  workshopImages.push({
    src: `assets/images/workshop/${outputName}`,
    fallback: `assets/images/workshop/${outputName}`,
    alt: "Kennedy Laser Works workshop equipment and in-house production area",
    width: size.width,
    height: size.height
  });
}

await writeFile(path.join(root, "data", "custom-projects.json"), `${JSON.stringify({ projects, workshopImages }, null, 2)}\n`);
console.log(`Imported ${projects.length} custom projects and ${workshopImages.length} workshop images.`);
