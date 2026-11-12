import { AssessmentProtocol } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Info } from 'lucide-react';

interface TestCardProps {
  test: {
    code: string;
    name: string;
    category: string;
    unit: string;
    description: string;
  };
  onStartTest: (code: string) => void;
}

export function TestCard({ test, onStartTest }: TestCardProps) {
  return (
    <Card className="flex flex-col justify-between border-slate-200 hover:border-slate-300 transition-all hover:shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-1">
          <Badge variant="brand" className="capitalize text-[10px]">
            {test.category}
          </Badge>
          <span className="text-xs text-slate-400 font-mono">{test.unit}</span>
        </div>
        <CardTitle className="text-base font-semibold">{test.name}</CardTitle>
        <CardDescription className="text-xs line-clamp-2 mt-1">
          {test.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-2"
          onClick={() => onStartTest(test.code)}
        >
          <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
          Conduct Test
        </Button>
      </CardContent>
    </Card>
  );
}
