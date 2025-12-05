import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Cloud, CloudRain, CloudLightning, Snowflake } from "lucide-react";

interface WeekData {
  weekNumber: number;
  stressLevel: "low" | "medium" | "high";
  stressScore: number;
  startDate: Date;
  endDate: Date;
}

interface StressWeatherForecastProps {
  weeks: WeekData[];
}

export const StressWeatherForecast = ({ weeks }: StressWeatherForecastProps) => {
  const displayWeeks = useMemo(() => {
    return weeks.slice(0, 5); // Show max 5 weeks in forecast
  }, [weeks]);

  const getWeatherIcon = (stressScore: number) => {
    if (stressScore <= 2) return <Sun className="w-10 h-10 text-yellow-400 drop-shadow-glow animate-pulse-soft" />;
    if (stressScore <= 4) return <Sun className="w-10 h-10 text-yellow-500" />;
    if (stressScore <= 6) return <Cloud className="w-10 h-10 text-slate-400" />;
    if (stressScore <= 8) return <CloudRain className="w-10 h-10 text-blue-400" />;
    return <CloudLightning className="w-10 h-10 text-purple-500 animate-pulse" />;
  };

  const getWeatherLabel = (stressScore: number) => {
    if (stressScore <= 2) return "Zonnig";
    if (stressScore <= 4) return "Helder";
    if (stressScore <= 6) return "Bewolkt";
    if (stressScore <= 8) return "Regenachtig";
    return "Storm";
  };

  const getWeatherDescription = (stressScore: number) => {
    if (stressScore <= 2) return "Relaxte week";
    if (stressScore <= 4) return "Lekker beheersbaar";
    if (stressScore <= 6) return "Wat drukker";
    if (stressScore <= 8) return "Tijd om te focussen";
    return "Volle bak!";
  };

  const getBackgroundGradient = (stressScore: number) => {
    if (stressScore <= 2) return "from-yellow-100/50 to-orange-100/30 dark:from-yellow-900/20 dark:to-orange-900/10";
    if (stressScore <= 4) return "from-sky-100/50 to-blue-100/30 dark:from-sky-900/20 dark:to-blue-900/10";
    if (stressScore <= 6) return "from-slate-200/50 to-gray-200/30 dark:from-slate-800/30 dark:to-gray-800/20";
    if (stressScore <= 8) return "from-blue-200/50 to-indigo-200/30 dark:from-blue-900/30 dark:to-indigo-900/20";
    return "from-purple-200/50 to-pink-200/30 dark:from-purple-900/30 dark:to-pink-900/20";
  };

  const getTemperature = (stressScore: number) => {
    // Convert stress to "temperature" - higher stress = hotter
    return Math.round(15 + (stressScore * 3));
  };

  if (displayWeeks.length === 0) return null;

  return (
    <Card className="overflow-hidden border-2 border-primary/20 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-full">
            <CloudLightning className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Stress Weerbericht</CardTitle>
            <CardDescription>Jouw studie-vooruitzichten voor de komende weken</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {displayWeeks.map((week, index) => (
            <div
              key={week.weekNumber}
              className={`
                relative flex flex-col items-center p-4 rounded-xl 
                bg-gradient-to-b ${getBackgroundGradient(week.stressScore)}
                border border-border/50 
                transition-all duration-300 hover:scale-105 hover:shadow-lg
                ${index === 0 ? 'ring-2 ring-primary/30' : ''}
              `}
            >
              {index === 0 && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                  Nu
                </span>
              )}
              
              <span className="text-xs text-muted-foreground mb-2">
                {week.startDate.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}
              </span>
              
              <div className="my-2">
                {getWeatherIcon(week.stressScore)}
              </div>
              
              <span className="text-2xl font-bold text-foreground">
                {getTemperature(week.stressScore)}°
              </span>
              
              <span className="text-sm font-medium text-foreground mt-1">
                {getWeatherLabel(week.stressScore)}
              </span>
              
              <span className="text-xs text-muted-foreground text-center mt-1">
                {getWeatherDescription(week.stressScore)}
              </span>
              
              <div className="mt-2 flex items-center gap-1">
                <span className={`
                  inline-block w-2 h-2 rounded-full
                  ${week.stressLevel === 'low' ? 'bg-stress-low' : 
                    week.stressLevel === 'medium' ? 'bg-stress-medium' : 'bg-stress-high'}
                `} />
                <span className="text-xs text-muted-foreground">
                  {week.stressScore}/10
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Weather Legend */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Sun className="w-4 h-4 text-yellow-400" />
              <span>Zonnig (0-2)</span>
            </div>
            <div className="flex items-center gap-1">
              <Sun className="w-4 h-4 text-yellow-500" />
              <span>Helder (3-4)</span>
            </div>
            <div className="flex items-center gap-1">
              <Cloud className="w-4 h-4 text-slate-400" />
              <span>Bewolkt (5-6)</span>
            </div>
            <div className="flex items-center gap-1">
              <CloudRain className="w-4 h-4 text-blue-400" />
              <span>Regen (7-8)</span>
            </div>
            <div className="flex items-center gap-1">
              <CloudLightning className="w-4 h-4 text-purple-500" />
              <span>Storm (9-10)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
