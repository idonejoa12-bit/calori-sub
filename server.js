import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json({ limit: "12mb" }));
app.use(express.static("."));
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/analyze-food", async (req, res) => {
  try {
    const { imageDataUrl } = req.body || {};
    if (!imageDataUrl || typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
      return res.status(400).json({ error: "Falta una foto válida." });
    }
    const response = await client.responses.create({
      model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text:
`Analizá esta foto de comida para una app de registro alimentario. Respondé SOLO JSON válido con esta estructura:
{"foods":[{"name":"nombre visible","kcal":100}],"totalKcal":100,"portion":"descripción prudente de porción","notes":"incertidumbres importantes"}
Estimá calorías de forma aproximada y conservadora solo para lo que se ve. No afirmes exactitud. Si no podés reconocerlo, indicá baja confianza en notes y usá una estimación amplia. No inventes ingredientes ocultos. kcal debe ser entero no negativo; totalKcal debe sumar foods.kcal. No des consejos para perder peso ni metas diarias.` },
          { type: "input_image", image_url: imageDataUrl, detail: "auto" }
        ]
      }]
    });
    const text = response.output_text || "";
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    const parsed = JSON.parse(clean);
    if (!Array.isArray(parsed.foods) || typeof parsed.totalKcal !== "number") {
      throw new Error("La respuesta de análisis no tenía el formato esperado.");
    }
    res.json(parsed);
  } catch (err) {
    console.error("Food image analysis error:", err.message);
    res.status(500).json({ error: "No se pudo analizar la foto. Verificá la configuración del servidor e intentá otra vez." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Calori Sub activo en http://localhost:${port}`));
