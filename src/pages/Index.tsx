import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Plus, Sparkles, Calendar, Clock } from "lucide-react";
import { SubjectForm } from "@/components/SubjectForm";
import { PlanningResults } from "@/components/PlanningResults";
import { ThemeToggle } from "@/components/ThemeToggle";

export interface Subject {
  id: string;
  name: string;
  deadline: string;
  studyHours: number;
  difficulty: "easy" | "medium" | "hard";
}

const Index = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyHours, setStudyHours] = useState(20);
  const [showResults, setShowResults] = useState(false);

  const handleAddSubject = (subject: Omit<Subject, "id">) => {
    setSubjects([...subjects, { ...subject, id: Math.random().toString() }]);
  };

  const handleRemoveSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const handleEditSubject = (id: string, updatedSubject: Omit<Subject, "id">) => {
    setSubjects(subjects.map(s => s.id === id ? { ...updatedSubject, id } : s));
  };

  const handleGeneratePlanning = () => {
    if (subjects.length === 0) {
      return;
    }
    setShowResults(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">StressLess Planner</h1>
                <p className="text-sm text-muted-foreground">AI-powered deadline planning voor studenten</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {!showResults ? (
          <div className="space-y-6">
            {/* Hero Section */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">Plan je deadlines slim</CardTitle>
                    <CardDescription className="text-base">
                      Vul je vakken en deadlines in en ontdek hoe zwaar je weken worden. 
                      AI maakt een persoonlijke planning met stress-scores per week.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Study Hours Input */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <CardTitle>Beschikbare studie-uren</CardTitle>
                </div>
                <CardDescription>
                  Hoeveel uur per week heb je beschikbaar om te studeren?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Label htmlFor="study-hours" className="text-sm font-medium min-w-fit">
                    Uren per week:
                  </Label>
                  <Input
                    id="study-hours"
                    type="number"
                    min="1"
                    max="100"
                    value={studyHours}
                    onChange={(e) => setStudyHours(parseInt(e.target.value) || 20)}
                    className="max-w-[120px]"
                  />
                  <span className="text-sm text-muted-foreground">
                    ({studyHours} uur)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Subjects Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  <CardTitle>Jouw vakken & deadlines</CardTitle>
                </div>
                <CardDescription>
                  Voeg alle vakken toe met hun deadlines en moeilijkheidsgraad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <SubjectForm 
                  onAdd={handleAddSubject} 
                  subjects={subjects}
                  onRemove={handleRemoveSubject}
                  onEdit={handleEditSubject}
                />
                
                {subjects.length > 0 && (
                  <div className="pt-4">
                    <Button 
                      onClick={handleGeneratePlanning}
                      className="w-full bg-primary hover:bg-primary/90"
                      size="lg"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Genereer Planning
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {subjects.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Plus className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    Voeg je eerste vak toe om te beginnen
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <PlanningResults 
            subjects={subjects}
            studyHours={studyHours}
            onBack={() => setShowResults(false)}
            onRecalculate={() => {
              // Trigger a re-render by slightly modifying state
              setStudyHours(prev => prev);
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
