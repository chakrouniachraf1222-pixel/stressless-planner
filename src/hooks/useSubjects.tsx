import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Subject {
  id: string;
  name: string;
  deadline: string;
  studyHours: number;
  difficulty: "easy" | "medium" | "hard";
}

interface DbSubject {
  id: string;
  name: string;
  deadline: string;
  study_hours: number;
  difficulty: string;
}

export const useSubjects = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyHours, setStudyHoursState] = useState(20);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) {
      setSubjects([]);
      setStudyHoursState(20);
      setLoading(false);
      return;
    }

    try {
      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select("*")
        .eq("user_id", user.id)
        .order("deadline", { ascending: true });

      if (subjectsError) throw subjectsError;

      const mappedSubjects: Subject[] = (subjectsData || []).map((s: DbSubject) => ({
        id: s.id,
        name: s.name,
        deadline: s.deadline,
        studyHours: s.study_hours,
        difficulty: s.difficulty as "easy" | "medium" | "hard",
      }));

      setSubjects(mappedSubjects);

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (settingsError) throw settingsError;

      if (settingsData) {
        setStudyHoursState(settingsData.study_hours_per_week);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Kon data niet laden");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addSubject = async (subject: Omit<Subject, "id">) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("subjects")
        .insert({
          user_id: user.id,
          name: subject.name,
          deadline: subject.deadline,
          study_hours: subject.studyHours,
          difficulty: subject.difficulty,
        })
        .select()
        .single();

      if (error) throw error;

      const newSubject: Subject = {
        id: data.id,
        name: data.name,
        deadline: data.deadline,
        studyHours: data.study_hours,
        difficulty: data.difficulty as "easy" | "medium" | "hard",
      };

      setSubjects((prev) => [...prev, newSubject]);
      toast.success("Vak toegevoegd");
    } catch (error) {
      console.error("Error adding subject:", error);
      toast.error("Kon vak niet toevoegen");
    }
  };

  const updateSubject = async (id: string, subject: Omit<Subject, "id">) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("subjects")
        .update({
          name: subject.name,
          deadline: subject.deadline,
          study_hours: subject.studyHours,
          difficulty: subject.difficulty,
        })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setSubjects((prev) =>
        prev.map((s) => (s.id === id ? { ...subject, id } : s))
      );
      toast.success("Vak bijgewerkt");
    } catch (error) {
      console.error("Error updating subject:", error);
      toast.error("Kon vak niet bijwerken");
    }
  };

  const removeSubject = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setSubjects((prev) => prev.filter((s) => s.id !== id));
      toast.success("Vak verwijderd");
    } catch (error) {
      console.error("Error removing subject:", error);
      toast.error("Kon vak niet verwijderen");
    }
  };

  const setStudyHours = async (hours: number) => {
    setStudyHoursState(hours);
    
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_settings")
        .upsert({
          user_id: user.id,
          study_hours_per_week: hours,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error saving study hours:", error);
      toast.error("Kon studie-uren niet opslaan");
    }
  };

  return {
    subjects,
    studyHours,
    loading,
    addSubject,
    updateSubject,
    removeSubject,
    setStudyHours,
    refresh: fetchData,
  };
};
