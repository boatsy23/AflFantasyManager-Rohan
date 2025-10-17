import { Card, CardContent } from "@/components/ui/card";

// Heatmap data - player disposals on the field
const heatmapData = [
  { x: 40, y: 30, value: 25, name: "M. Bontempelli" },
  { x: 30, y: 40, value: 21, name: "C. Oliver" },
  { x: 60, y: 45, value: 19, name: "J. Macrae" },
  { x: 45, y: 60, value: 18, name: "Z. Merrett" },
  { x: 55, y: 20, value: 16, name: "S. Walsh" },
  { x: 70, y: 35, value: 14, name: "L. Parker" },
  { x: 25, y: 55, value: 13, name: "A. Brayshaw" },
  { x: 35, y: 65, value: 12, name: "T. Mitchell" },
  { x: 65, y: 50, value: 11, name: "P. Cripps" },
  { x: 50, y: 70, value: 10, name: "N. Daicos" },
];

export default function DisposalHeatmap() {
  return (
    <Card className="bg-gray-900 border-gray-700 text-white overflow-hidden">
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-lg font-bold text-blue-400">DISPOSAL HEATMAP</h3>
      </div>
      <CardContent className="p-4">
        <div className="relative w-full h-[300px]">
          {/* AFL Field Oval */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-[90%] h-[80%]">
              {/* Oval field outline */}
              <div className="absolute inset-0 border-2 border-gray-600 rounded-[100%]"></div>
              
              {/* Center line and circle */}
              <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-600 -translate-x-1/2"></div>
              <div className="absolute top-1/2 left-1/2 w-20 h-20 -ml-10 -mt-10 border-2 border-gray-600 rounded-full"></div>
              
              {/* 50m arcs */}
              <div className="absolute top-1/4 left-1/2 w-[60%] h-[50%] -ml-[30%] -mt-[25%] border-b-2 border-gray-600 rounded-[100%]"></div>
              <div className="absolute bottom-1/4 left-1/2 w-[60%] h-[50%] -ml-[30%] -mb-[25%] border-t-2 border-gray-600 rounded-[100%]"></div>
              
              {/* Heat points */}
              {heatmapData.map((point, index) => (
                <div 
                  key={index}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    width: point.value * 1.2,
                    height: point.value * 1.2,
                    borderRadius: '50%',
                    backgroundColor: `rgba(52, 211, 153, ${0.1 + point.value / 50})`,
                    boxShadow: `0 0 ${point.value / 2}px rgba(52, 211, 153, 0.6)`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: Math.floor(point.value)
                  }}
                >
                  <div className="text-xs font-semibold text-white opacity-80">
                    {point.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-2 right-2 bg-gray-800/70 p-2 rounded-md">
            <div className="text-xs text-gray-300 mb-1">Disposal Intensity</div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-emerald-800"></div>
                <div className="ml-1 text-xs text-gray-400">Low</div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
                <div className="ml-1 text-xs text-gray-400">Med</div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <div className="ml-1 text-xs text-gray-400">High</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
