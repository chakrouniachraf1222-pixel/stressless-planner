CREATE TABLE public.subject_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.subject_documents TO authenticated;
GRANT ALL ON public.subject_documents TO service_role;
ALTER TABLE public.subject_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own docs select" ON public.subject_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own docs insert" ON public.subject_documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own docs delete" ON public.subject_documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.limit_subject_documents()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.subject_documents WHERE subject_id = NEW.subject_id) >= 5 THEN
    RAISE EXCEPTION 'Maximaal 5 documenten per vak';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER limit_subject_documents_trg BEFORE INSERT ON public.subject_documents
FOR EACH ROW EXECUTE FUNCTION public.limit_subject_documents();

ALTER TABLE public.subjects ADD COLUMN ai_plan jsonb;

CREATE POLICY "own files select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'subject-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own files insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'subject-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own files delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'subject-documents' AND (storage.foldername(name))[1] = auth.uid()::text);