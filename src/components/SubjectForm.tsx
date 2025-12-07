import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, Pencil } from "lucide-react";
import { Subject } from "@/hooks/useSubjects";

interface SubjectFormProps {
  onAdd: (subject: Omit<Subject, "id">) => void;
  subjects: Subject[];
  onRemove: (id: string) => void;
  onEdit: (id: string, subject: Omit<Subject, "id">) => void;
}

export const SubjectForm = ({ onAdd, subjects, onRemove, onEdit }: SubjectFormProps) => {
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [studyHours, setStudyHours] = useState(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Get tomorrow's date as minimum deadline
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !deadline) return;

    if (editingId) {
      onEdit(editingId, { name, deadline, studyHours, difficulty });
      setEditingId(null);
    } else {
      onAdd({ name, deadline, studyHours, difficulty });
    }
    
    setName("");
    setDeadline("");
    setStudyHours(10);
    setDifficulty("medium");
  };

  const handleEdit = (subject: Subject) => {
    setName(subject.name);
    setDeadline(subject.deadline);
    setStudyHours(subject.studyHours);
    setDifficulty(subject.difficulty);
    setEditingId(subject.id);
  };

  const handleCancelEdit = () => {
    setName("");
    setDeadline("");
    setStudyHours(10);
    setDifficulty("medium");
    setEditingId(null);
  };

  const difficultyColors = {
    easy: "text-stress-low",
    medium: "text-stress-medium",
    hard: "text-stress-high",
  };

  const difficultyLabels = {
    easy: "Makkelijk",
    medium: "Gemiddeld",
    hard: "Moeilijk",
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Vak naam</Label>
            <Input
              id="name"
              placeholder="bijv. Statistiek"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={getTomorrowDate()}
              required
            />
            <p className="text-xs text-muted-foreground">Je kunt alleen plannen vanaf morgen</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="studyHours">Benodigde studie-uren</Label>
            <div className="flex items-center gap-2">
              <Input
                id="studyHours"
                type="number"
                min="1"
                max="200"
                value={studyHours}
                onChange={(e) => setStudyHours(parseInt(e.target.value) || 10)}
                className="max-w-[100px]"
              />
              <span className="text-sm text-muted-foreground">{studyHours} uur totaal</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Moeilijkheidsgraad</Label>
            <Select value={difficulty} onValueChange={(value: any) => setDifficulty(value)}>
              <SelectTrigger id="difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Makkelijk</SelectItem>
                <SelectItem value="medium">Gemiddeld</SelectItem>
                <SelectItem value="hard">Moeilijk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" className="flex-1">
            <Plus className="w-4 h-4 mr-2" />
            {editingId ? "Vak bijwerken" : "Vak toevoegen"}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={handleCancelEdit}>
              Annuleer
            </Button>
          )}
        </div>
      </form>

      {subjects.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-muted-foreground">Toegevoegde vakken:</h3>
          {subjects.map((subject) => (
            <Card key={subject.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{subject.name}</h4>
                    <span className={`text-xs font-medium ${difficultyColors[subject.difficulty]}`}>
                      {difficultyLabels[subject.difficulty]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>📅 {new Date(subject.deadline).toLocaleDateString('nl-NL')}</span>
                    <span>⏱️ {subject.studyHours} uur</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(subject)}
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(subject.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
