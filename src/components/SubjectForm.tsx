import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { Subject } from "@/pages/Index";

interface SubjectFormProps {
  onAdd: (subject: Omit<Subject, "id">) => void;
  subjects: Subject[];
  onRemove: (id: string) => void;
}

export const SubjectForm = ({ onAdd, subjects, onRemove }: SubjectFormProps) => {
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [weight, setWeight] = useState(50);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !deadline) return;

    onAdd({ name, deadline, weight, difficulty });
    setName("");
    setDeadline("");
    setWeight(50);
    setDifficulty("medium");
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
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Gewicht (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="weight"
                type="number"
                min="1"
                max="100"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value) || 50)}
                className="max-w-[100px]"
              />
              <span className="text-sm text-muted-foreground">{weight}%</span>
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

        <Button type="submit" className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Vak toevoegen
        </Button>
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
                    <span>⚖️ {subject.weight}%</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(subject.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
