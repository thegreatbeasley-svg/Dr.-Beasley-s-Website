import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { getDb } from "@/lib/db";
import { RESOURCE_FILES_DIR } from "@/lib/paths";
import { createResource, slugify } from "@/lib/resources/queries";

/**
 * Generates a short, clearly-labeled placeholder PDF entirely in-process
 * (no template files, no network) so the demo has real, openable files to
 * gate and download from the very first run.
 */
async function buildSamplePdf(title: string, bodyLines: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]); // US Letter
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 64;
  let y = 792 - margin;

  page.drawText("SAMPLE — DEMONSTRATION CONTENT", {
    x: margin,
    y,
    size: 10,
    font: bold,
    color: rgb(0.7, 0.35, 0.05),
  });
  y -= 28;

  page.drawText(title, { x: margin, y, size: 22, font: bold, color: rgb(0.1, 0.09, 0.08) });
  y -= 36;

  for (const line of bodyLines) {
    page.drawText(line, { x: margin, y, size: 12, font, color: rgb(0.2, 0.2, 0.2), maxWidth: 612 - margin * 2 });
    y -= 22;
  }

  y -= 20;
  page.drawText(
    "This placeholder file exists only to demonstrate the download flow of this local demo.",
    { x: margin, y, size: 10, font, color: rgb(0.45, 0.45, 0.45), maxWidth: 612 - margin * 2 }
  );
  y -= 16;
  page.drawText(
    "It is not authored by, or attributed to, Dr. Virgil Beasly.",
    { x: margin, y, size: 10, font, color: rgb(0.45, 0.45, 0.45) }
  );

  return doc.save();
}

type SeedResource = {
  title: string;
  resourceType: "Guide" | "Worksheet" | "Book";
  shortDescription: string;
  longDescription: string;
  bodyLines: string[];
  published: boolean;
  featured: boolean;
};

const SEED_RESOURCES: SeedResource[] = [
  {
    title: "Sample Getting Started Guide",
    resourceType: "Guide",
    shortDescription: "A short demonstration guide showing how downloads work on this site.",
    longDescription:
      "This is placeholder demonstration content used to show how a visitor requests and receives a resource on this site. It is not a real publication and contains no clinical or biographical claims.",
    bodyLines: [
      "This is a sample guide used to demonstrate the resource library.",
      "Real content would replace this file once approved.",
      "",
      "What this demo shows:",
      "- A visitor fills in name, city, and email",
      "- The request and consent choice are saved locally",
      "- A working download link is generated",
    ],
    published: true,
    featured: true,
  },
  {
    title: "Sample Weekly Reflection Worksheet",
    resourceType: "Worksheet",
    shortDescription: "A short fill-in-the-blank worksheet used to demonstrate the library.",
    longDescription:
      "Demonstration content only. A finished worksheet would be reviewed and supplied separately before this resource goes live for real visitors.",
    bodyLines: [
      "This is a sample worksheet used to demonstrate the resource library.",
      "",
      "1. One thing I want to remember this week:",
      "2. One small step I can take:",
      "3. A question I'm sitting with:",
    ],
    published: true,
    featured: false,
  },
  {
    title: "Sample Book Chapter Excerpt",
    resourceType: "Book",
    shortDescription: "A brief placeholder excerpt used to demonstrate the book resource type.",
    longDescription:
      "Demonstration content only, standing in for a future book excerpt. No authorship, publication, or availability claims should be inferred from this file.",
    bodyLines: [
      "This is a sample excerpt used to demonstrate the resource library.",
      "A real excerpt, once approved, would replace this placeholder file.",
    ],
    published: true,
    featured: false,
  },
  {
    title: "Sample Draft Resource (Unpublished)",
    resourceType: "Guide",
    shortDescription: "A draft resource used to demonstrate publish/unpublish in the admin area.",
    longDescription:
      "This resource is intentionally left unpublished so the demo can show that draft resources stay hidden from the public site and cannot be requested until an admin publishes them.",
    bodyLines: [
      "This is a draft sample resource.",
      "It should not be visible on the public site until published from the admin area.",
    ],
    published: false,
    featured: false,
  },
];

export async function seedDatabaseIfEmpty() {
  const db = getDb();
  const { count } = db.prepare(`SELECT COUNT(*) as count FROM resources`).get() as {
    count: number;
  };
  if (count > 0) return;

  for (const seed of SEED_RESOURCES) {
    const pdfBytes = await buildSamplePdf(seed.title, seed.bodyLines);
    const fileName = `${crypto.randomUUID()}.pdf`;
    await fs.writeFile(path.join(RESOURCE_FILES_DIR, fileName), pdfBytes);

    createResource({
      title: seed.title,
      slug: slugify(seed.title),
      short_description: seed.shortDescription,
      long_description: seed.longDescription,
      resource_type: seed.resourceType,
      file_path: fileName,
      file_name: `${slugify(seed.title)}.pdf`,
      file_size: pdfBytes.byteLength,
      cover_image_path: null,
      is_demo_content: true,
      published: seed.published,
      featured: seed.featured,
    });
  }

   
  console.log(`[seed] Created ${SEED_RESOURCES.length} sample resources.`);
}
