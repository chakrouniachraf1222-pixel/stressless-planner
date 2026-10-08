import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const toBase64 = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: auth } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Niet ingelogd" }, 401);

    const { subjectId } = await req.json();
    if (typeof subjectId !== "string") return json({ error: "Ongeldig verzoek" }, 400);

    const { data: subject } = await userClient.from("subjects").select("*").eq("id", subjectId).maybeSingle();
    if (!subject) return json({ error: "Vak niet gevonden" }, 404);
    const { data: docs } = await userClient.from("subject_documents").select("*").eq("subject_id", subjectId);
    if (!docs?.length) return json({ error: "Upload eerst minstens één document" }, 400);

    const content: any[] = [];
    for (const d of docs) {
      const { data: file } = await userClient.storage.from("subject-documents").download(d.storage_path);
      if (!file) continue;
      if ((d.mime_type ?? "").startsWith("text/")) {
        content.push({ type: "input_text", text: `Document "${d.file_name}":\n${(await file.text()).slice(0, 50000)}` });
      } else {
        content.push({
          type: "input_file",
          filename: d.file_name,
          file_data: `data:${d.mime_type || "application/pdf"};base64,${toBase64(await file.arrayBuffer())}`,
        });
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    content.unshift({
      type: "input_text",
      text: `Je bent een studieplanner voor HBO/WO-studenten. Vandaag is ${today}. Vak: "${subject.name}". Deadline: ${subject.deadline}. Totaal beschikbare studie-uren voor dit vak: ${subject.study_hours}. Moeilijkheid: ${subject.difficulty}.
Lees de bijgevoegde documenten (bijv. leswijzer) en bepaal welke stof/onderwerpen gekend moeten zijn. Maak een concrete dagplanning van vandaag tot de dag vóór de deadline. Per dag: specifieke taak in het Nederlands (bijv. "Hoofdstuk 3 lezen: regressie-analyse"), en aantal uren (halve uren). Totaal uren ≈ ${subject.study_hours}. Sla dagen over als dat logisch is. Geef ook een korte samenvatting (max 3 zinnen) van wat je moet kennen.`,
    });

    const schema = {
      type: "object",
      additionalProperties: false,
      required: ["summary", "days"],
      properties: {
        summary: { type: "string" },
        days: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["date", "task", "hours"],
            properties: { date: { type: "string", description: "YYYY-MM-DD" }, task: { type: "string" }, hours: { type: "number" } },
          },
        },
      },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": Deno.env.get("LOVABLE_API_KEY")!,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: [{ role: "user", content }],
        reasoning: { effort: "low" },
        store: false,
        stream: true,
        text: { format: { type: "json_schema", name: "plan", strict: true, schema } },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("AI error", res.status, t);
      if (res.status === 429) return json({ error: "Te veel verzoeken, probeer het later opnieuw" }, 429);
      if (res.status === 402) return json({ error: "AI-tegoed is op" }, 402);
      return json({ error: "AI kon de documenten niet verwerken" }, 502);
    }

    let out = "", buf = "";
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const l of lines) {
        if (!l.startsWith("data:")) continue;
        const p = l.slice(5).trim();
        if (!p || p === "[DONE]") continue;
        try {
          const ev = JSON.parse(p);
          if (ev.type === "response.output_text.delta") out += ev.delta;
        } catch { /* ignore */ }
      }
    }

    const plan = JSON.parse(out);
    await userClient.from("subjects").update({ ai_plan: plan }).eq("id", subjectId);
    return json({ plan });
  } catch (e) {
    console.error(e);
    return json({ error: "Er ging iets mis" }, 500);
  }
});
