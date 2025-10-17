import { CashGenerationTracker } from "@/components/tools/cash";

export default function PreviewTool() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tool Preview</h1>
      <CashGenerationTracker />
    </div>
  );
}