import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Trash2, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Doc { id: string; file_name: string; storage_path: string }
const MAX = 5;

export const SubjectDocuments = ({ subjectId, onPlanned }: { subjectId: string; onPlanned: () => void }) => {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [busy, setBusy] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase.from("subject_documents").select("id,file_name,storage_path").eq("subject_id", subjectId).order("created_at");
    setDocs(data ?? []);
  };
  useEffect(() => { load(); }, [subjectId]);

  const upload = async (files: FileList | null) => {
    if (!files || !user) return;
    const list = Array.from(files).slice(0, MAX - docs.length);
    if (files.length > list.length) toast.error(`Maximaal ${MAX} documenten per vak`);
    setBusy(true);
    for (const f of list) {
      if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} is groter dan 10MB`); continue; }
      const path = `${user.id}/${subjectId}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("subject-documents").upload(path, f, { contentType: f.type });
      if (error) { toast.error(`Upload mislukt: ${f.name}`); continue; }
      const { error: e2 } = await supabase.from("subject_documents").insert({
        user_id: user.id, subject_id: subjectId, file_name: f.name, storage_path: path, mime_type: f.type || "application/pdf",
      });
      if (e2) { await supabase.storage.from("subject-documents").remove([path]); toast.error(e2.message); }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    load();
  };

  const remove = async (d: Doc) => {
    await supabase.storage.from("subject-documents").remove([d.storage_path]);
    await supabase.from("subject_documents").delete().eq("id", d.id);
    load();
  };

  const analyze = async () => {
    setAnalyzing(true);
    const { data, error } = await supabase.functions.invoke("analyze-subject", { body: { subjectId } });
    setAnalyzing(false);
    if (error || data?.error) {
      let msg = data?.error;
      try { msg = msg ?? (await (error as any).context.json()).error; } catch { /* */ }
      toast.error(msg ?? "Kon planning niet maken");
      return;
    }
    toast.success("Slimme dagplanning gemaakt op basis van je documenten");
    onPlanned();
  };

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Documenten ({docs.length}/{MAX}) — bijv. leswijzer</span>
        <input ref={input} type="file" multiple hidden accept=".pdf,.txt,.md,application/pdf,text/plain" onChange={(e) => upload(e.target.files)} />
        <Button size="sm" variant="outline" disabled={busy || docs.length >= MAX} onClick={() => input.current?.click()}>
          {busy ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />} Upload
        </Button>
      </div>
      {docs.map((d) => (
        <div key={d.id} className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1">
          <span className="flex items-center gap-2 truncate"><FileText className="w-4 h-4 shrink-0" />{d.file_name}</span>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => remove(d)}><Trash2 className="w-3 h-3" /></Button>
        </div>
      ))}
      {docs.length > 0 && (
        <Button size="sm" className="w-full" onClick={analyze} disabled={analyzing}>
          {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {analyzing ? "Documenten lezen..." : "Maak slimme dagplanning"}
        </Button>
      )}
    </div>
  );
};
