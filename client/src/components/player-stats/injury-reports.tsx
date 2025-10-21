import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

const injuryData: any[] = [];

export default function InjuryReports() {
  const getStatusColor = (status: string) => {
    if (status.includes("Out")) return "text-red-500";
    if (status.includes("Test")) return "text-yellow-500";
    if (status.includes("Available")) return "text-green-500";
    return "text-gray-400";
  };

  if (injuryData.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gray-900 border-gray-700 text-white overflow-hidden">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-lg font-bold text-blue-400">INJURY UPDATES</h3>
        <div className="text-xs text-gray-400 mt-1">Click on player name for detailed injury report</div>
      </div>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-800">
          {injuryData.map((injury, index) => (
            <div key={index} className="p-3 hover:bg-gray-800/50">
              <div className="flex justify-between items-center">
                <div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="text-white font-semibold hover:text-blue-400 transition-colors flex items-center">
                        {injury.player}
                        <Info className="ml-1 h-3 w-3 text-gray-400" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-blue-400">{injury.player} | {injury.team}</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          <span className={getStatusColor(injury.status)}>{injury.status}</span> - {injury.injury}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-2 space-y-2">
                        <div className="text-sm">{injury.details}</div>
                        <div className="text-xs text-gray-400">Last updated: {injury.updated}</div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <div className="text-xs text-gray-400">{injury.team} | {injury.position}</div>
                </div>
                <div>
                  <div className={`text-sm font-semibold ${getStatusColor(injury.status)}`}>
                    {injury.status}
                  </div>
                  <div className="text-xs text-gray-400 text-right">{injury.injury}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
