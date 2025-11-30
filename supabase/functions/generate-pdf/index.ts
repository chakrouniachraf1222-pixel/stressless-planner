import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Subject {
  id: string;
  name: string;
  deadline: string;
  studyHours: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface WeekData {
  week: number;
  startDate: string;
  endDate: string;
  deadlines: Subject[];
  stressLevel: 'low' | 'medium' | 'high';
  stressScore: number;
  requiredHours: number;
  tasks: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subjects, studyHours, weeklyPlanning } = await req.json();

    console.log('Generating PDF for planning with', subjects.length, 'subjects');

    // Generate HTML content for PDF
    const htmlContent = generateHTMLContent(subjects, studyHours, weeklyPlanning);

    // Return HTML that can be converted to PDF on client side
    return new Response(JSON.stringify({ html: htmlContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-pdf function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateHTMLContent(subjects: Subject[], studyHours: number, weeklyPlanning: WeekData[]): string {
  const totalDeadlines = subjects.length;
  const avgStress = (weeklyPlanning.reduce((acc, week) => acc + week.stressScore, 0) / weeklyPlanning.length).toFixed(1);
  const peakWeek = weeklyPlanning.reduce((max, week) => week.stressScore > max.stressScore ? week : max, weeklyPlanning[0]);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    h1 {
      color: #0891b2;
      border-bottom: 3px solid #0891b2;
      padding-bottom: 10px;
    }
    h2 {
      color: #0e7490;
      margin-top: 30px;
    }
    .summary {
      background: #f0f9ff;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .summary-item {
      margin: 10px 0;
      font-size: 16px;
    }
    .week-section {
      margin: 30px 0;
      padding: 20px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    .week-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .stress-badge {
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
    }
    .stress-low { background: #dcfce7; color: #166534; }
    .stress-medium { background: #fef3c7; color: #92400e; }
    .stress-high { background: #fee2e2; color: #991b1b; }
    .deadline-item {
      background: #f9fafb;
      padding: 10px;
      margin: 5px 0;
      border-radius: 4px;
    }
    .tasks-list {
      margin-top: 15px;
    }
    .task-item {
      padding: 8px;
      margin: 5px 0;
      background: #ffffff;
      border-left: 3px solid #0891b2;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <h1>StressLess Planner - Jouw Studieplanning</h1>
  
  <div class="summary">
    <h2>Overzicht</h2>
    <div class="summary-item"><strong>Totaal deadlines:</strong> ${totalDeadlines}</div>
    <div class="summary-item"><strong>Beschikbare studie-uren per week:</strong> ${studyHours} uur</div>
    <div class="summary-item"><strong>Gemiddelde stress:</strong> ${avgStress}/10</div>
    <div class="summary-item"><strong>Zwaarste week:</strong> Week ${peakWeek.week} (${peakWeek.stressScore.toFixed(1)}/10)</div>
  </div>

  <h2>Jouw Vakken</h2>
  ${subjects.map(subject => `
    <div class="deadline-item">
      <strong>${subject.name}</strong> - Deadline: ${new Date(subject.deadline).toLocaleDateString('nl-NL')}
      <br>Studie-uren: ${subject.studyHours} uur | Moeilijkheid: ${getDifficultyLabel(subject.difficulty)}
    </div>
  `).join('')}

  <h2>Weekplanning</h2>
  ${weeklyPlanning.map(week => `
    <div class="week-section">
      <div class="week-header">
        <h3>Week ${week.week}: ${week.startDate} - ${week.endDate}</h3>
        <span class="stress-badge stress-${week.stressLevel}">
          Stress: ${week.stressScore.toFixed(1)}/10
        </span>
      </div>
      
      <div><strong>Benodigde studie-uren:</strong> ${week.requiredHours.toFixed(1)} uur</div>
      
      ${week.deadlines.length > 0 ? `
        <div style="margin-top: 15px;">
          <strong>Deadlines deze week:</strong>
          ${week.deadlines.map(d => `
            <div class="deadline-item">
              ${d.name} - ${new Date(d.deadline).toLocaleDateString('nl-NL')}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="tasks-list">
        <strong>Aanbevolen taken:</strong>
        ${week.tasks.map(task => `
          <div class="task-item">${task}</div>
        `).join('')}
      </div>
    </div>
  `).join('')}

  <div class="footer">
    <p>Gegenereerd door StressLess Planner</p>
    <p>Succes met je studie!</p>
  </div>
</body>
</html>
  `;
}

function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: 'Makkelijk',
    medium: 'Gemiddeld',
    hard: 'Moeilijk'
  };
  return labels[difficulty] || difficulty;
}
