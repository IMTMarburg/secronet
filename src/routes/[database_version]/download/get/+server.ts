import fs from "fs/promises";
import { get_database_zip } from "$lib/data";

export async function GET({ params }) {
  // Path to the file on disk
  const filePath = get_database_zip(params.database_version);
  const fileName = params.database_version + ".zip";

  try {
    // Check if the file exists
    await fs.access(filePath);

    // Read the file contents
    const fileBuffer = await fs.readFile(filePath);

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "File not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
}
