import { useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, AlertTriangle, CheckCircle2, Download } from "lucide-react";
import { Subject } from "@/pages/Index";
import { toast } from "sonner";
import { StressWeatherForecast } from "./StressWeatherForecast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
interface PlanningResultsProps {
  subjects: Subject[];
  studyHours: number;
  onBack: () => void;
}

interface WeekData {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  deadlines: Subject[];
  stressLevel: "low" | "medium" | "high";
  stressScore: number;
  requiredHours: number;
  tasks: string[];
}

export const PlanningResults = ({ subjects, studyHours, onBack }: PlanningResultsProps) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const weeklyPlanning = useMemo(() => {
    if (subjects.length === 0) return [];

    // Find earliest and latest deadline
    const dates = subjects.map(s => new Date(s.deadline));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())));

    // Generate weeks
    const weeks: WeekData[] = [];
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week

    let weekNumber = 1;
    while (currentDate <= endDate) {
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const deadlinesThisWeek = subjects.filter(s => {
        const deadline = new Date(s.deadline);
        return deadline >= currentDate && deadline <= weekEnd;
      });

      // Calculate stress score based on study hours
      const requiredHours = deadlinesThisWeek.reduce((total, subject) => {
        return total + subject.studyHours;
      }, 0);

      const stressScore = Math.min(10, Math.round((requiredHours / studyHours) * 10));
      const stressLevel: "low" | "medium" | "high" = 
        stressScore < 4 ? "low" : 
        stressScore < 7 ? "medium" : "high";

      const tasks = deadlinesThisWeek.map(s => 
        `Werk aan ${s.name} (deadline ${new Date(s.deadline).toLocaleDateString('nl-NL')})`
      );

      weeks.push({
        weekNumber,
        startDate: new Date(currentDate),
        endDate: new Date(weekEnd),
        deadlines: deadlinesThisWeek,
        stressLevel,
        stressScore,
        requiredHours: Math.round(requiredHours),
        tasks,
      });

      currentDate.setDate(currentDate.getDate() + 7);
      weekNumber++;
    }

    return weeks;
  }, [subjects, studyHours]);

  const getStressColor = (level: "low" | "medium" | "high") => {
    return level === "low" 
      ? "bg-stress-low text-stress-low-foreground" 
      : level === "medium"
      ? "bg-stress-medium text-stress-medium-foreground"
      : "bg-stress-high text-stress-high-foreground";
  };

  const getStressIcon = (level: "low" | "medium" | "high") => {
    return level === "low" 
      ? <CheckCircle2 className="w-4 h-4" />
      : <AlertTriangle className="w-4 h-4" />;
  };

  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      
      // Calculate how many pages we need
      const scaledHeight = (imgHeight * pdfWidth) / imgWidth;
      const pageHeight = pdfHeight;
      let heightLeft = scaledHeight;
      let position = 0;
      
      // First page
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
      heightLeft -= pageHeight;
      
      // Add more pages if needed
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, scaledHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('stressless-planning.pdf');
      toast.success("PDF succesvol gedownload!");
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error("Fout bij het genereren van de PDF. Probeer het opnieuw.");
    } finally {
      setIsDownloading(false);
    }
  };

  const totalDeadlines = subjects.length;
  const averageStress = weeklyPlanning.length > 0 
    ? (weeklyPlanning.reduce((sum, w) => sum + w.stressScore, 0) / weeklyPlanning.length).toFixed(1)
    : 0;
  const peakWeek = weeklyPlanning.reduce((max, w) => w.stressScore > max.stressScore ? w : max, weeklyPlanning[0]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Terug naar planning
        </Button>
        <Button 
          variant="default" 
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? "Genereren..." : "Download PDF"}
        </Button>
      </div>

      {/* PDF Content - This will be captured */}
      <div ref={contentRef} className="space-y-6 bg-background p-4 rounded-lg">
        {/* Stress Weather Forecast - Unique Feature */}
        <StressWeatherForecast weeks={weeklyPlanning} />

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Totaal Deadlines</CardDescription>
            <CardTitle className="text-3xl">{totalDeadlines}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Gemiddelde Stress</CardDescription>
            <CardTitle className="text-3xl">{averageStress}/10</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Zwaarste Week</CardDescription>
            <CardTitle className="text-3xl">Week {peakWeek?.weekNumber}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Weekly Breakdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <CardTitle>Jouw Planning per Week</CardTitle>
          </div>
          <CardDescription>
            AI-gegenereerd overzicht van je studie-weken met stress-indicatoren
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {weeklyPlanning.map((week) => (
            <Card key={week.weekNumber} className="overflow-hidden">
              <div className={`h-2 ${getStressColor(week.stressLevel).split(' ')[0]}`} />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">Week {week.weekNumber}</CardTitle>
                      <Badge variant="outline" className={`${getStressColor(week.stressLevel)} border-0`}>
                        {getStressIcon(week.stressLevel)}
                        <span className="ml-1">{week.stressScore}/10</span>
                      </Badge>
                    </div>
                    <CardDescription>
                      {week.startDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} - {' '}
                      {week.endDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{week.requiredHours} uur</div>
                    <div className="text-xs text-muted-foreground">benodigd</div>
                  </div>
                </div>
              </CardHeader>
              
              {week.deadlines.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Deadlines:</h4>
                      <div className="space-y-1">
                        {week.deadlines.map((subject) => (
                          <div key={subject.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-md p-2">
                            <span className="font-medium">{subject.name}</span>
                            <span className="text-muted-foreground">
                              {new Date(subject.deadline).toLocaleDateString('nl-NL')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Taken deze week:</h4>
                      <ul className="space-y-1 text-sm">
                        {week.tasks.map((task, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {week.stressLevel === "high" && (
                      <div className="bg-stress-high/10 border border-stress-high/20 rounded-md p-3 text-sm">
                        <p className="font-medium text-stress-high mb-1">⚠️ Zware week</p>
                        <p className="text-muted-foreground">
                          Deze week is zwaar omdat je {week.deadlines.length} deadline{week.deadlines.length > 1 ? 's' : ''} hebt 
                          en ongeveer {week.requiredHours} uur studie nodig hebt terwijl je {studyHours} uur beschikbaar hebt.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}

              {week.deadlines.length === 0 && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground italic">Geen deadlines deze week</p>
                </CardContent>
              )}
            </Card>
          ))}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};
