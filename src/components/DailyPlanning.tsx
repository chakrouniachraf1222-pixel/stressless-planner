import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Flag } from "lucide-react";
import { Subject } from "@/hooks/useSubjects";

interface Props {
  subjects: Subject[];
  studyHours: number;
}

interface DayTask {
  subject: Subject;
  hours: number;
  activity: string;
}

const activities = ["Lezen & stof doornemen", "Samenvatten", "Oefenen", "Oefenen & opdrachten", "Herhalen"];

const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const round = (n: number) => Math.round(n * 2) / 2;

export const DailyPlanning = ({ subjects, studyHours }: Props) => {
  const days = useMemo(() => {
    const today = startOfDay(new Date());
    const map = new Map<string, { date: Date; tasks: DayTask[]; deadlines: Subject[] }>();
    const key = (d: Date) => d.toISOString().slice(0, 10);
    const ensure = (d: Date) => {
      const k = key(d);
      if (!map.has(k)) map.set(k, { date: new Date(d), tasks: [], deadlines: [] });
      return map.get(k)!;
    };

    for (const s of subjects) {
      const deadline = startOfDay(new Date(s.deadline));
      if (deadline < today) continue;
      ensure(deadline).deadlines.push(s);
      if (s.aiPlan?.days?.length) {
        for (const d of s.aiPlan.days) {
          const date = startOfDay(new Date(d.date));
          if (date < today || date >= deadline) continue;
          ensure(date).tasks.push({ subject: s, hours: d.hours, activity: d.task });
        }
        continue;
      }
      const dayCount = Math.max(1, Math.round((deadline.getTime() - today.getTime()) / 86400000));
      const perDay = s.studyHours / dayCount;
      for (let i = 0; i < dayCount; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const phase = Math.min(activities.length - 1, Math.floor((i / dayCount) * activities.length));
        const hours = round(perDay);
        if (hours <= 0) continue;
        ensure(d).tasks.push({ subject: s, hours, activity: activities[phase] });
      }
    }
    return [...map.values()].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [subjects]);

  const dailyCapacity = studyHours / 7;
  const todayKey = startOfDay(new Date()).getTime();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <CardTitle>Jouw Planning per Dag</CardTitle>
        </div>
        <CardDescription>Vanaf vandaag: per dag wat je doet voor welk vak</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {days.length === 0 && <p className="text-sm text-muted-foreground italic">Geen komende deadlines.</p>}
        {days.map((day) => {
          const total = day.tasks.reduce((s, t) => s + t.hours, 0);
          const over = total > dailyCapacity * 1.2;
          const isToday = day.date.getTime() === todayKey;
          return (
            <div key={day.date.toISOString()} className={`rounded-lg border p-3 ${isToday ? "border-primary bg-primary/5" : "border-border"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold capitalize">
                  {isToday && <Badge className="mr-2">Vandaag</Badge>}
                  {day.date.toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}
                </div>
                <span className={`text-sm font-medium ${over ? "text-stress-high" : "text-muted-foreground"}`}>
                  {total} uur
                </span>
              </div>
              <ul className="space-y-1 text-sm">
                {day.tasks.map((t, i) => (
                  <li key={i} className="flex justify-between bg-muted/50 rounded-md px-2 py-1">
                    <span><span className="font-medium">{t.subject.name}</span> — {t.activity}</span>
                    <span className="text-muted-foreground">{t.hours}u</span>
                  </li>
                ))}
                {day.deadlines.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 text-stress-high font-medium px-2 py-1">
                    <Flag className="w-4 h-4" /> Deadline: {s.name}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
