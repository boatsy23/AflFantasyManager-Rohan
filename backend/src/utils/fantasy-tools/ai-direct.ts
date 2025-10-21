import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Execute a Python AI tool function directly using child_process
 * @param tool The AI tool function to execute
 * @returns The JSON result from the Python function
 */
async function executeAITool(tool: string): Promise<any> {
  try {
    // Run the Python script with the specified tool
    const command = `python3 -c "import ai_tools; import json; result = ai_tools.${tool}(); print(json.dumps(result))"`;
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.error(`Error executing AI tool ${tool}:`, stderr);
      return { status: 'error', message: 'Error executing AI tool' };
    }
    
    // Parse the JSON output
    const result = JSON.parse(stdout.trim());
    return { status: 'ok', ...result };
  } catch (error) {
    console.error(`Exception executing AI tool ${tool}:`, error);
    return { status: 'error', message: 'Failed to execute AI tool', error: String(error) };
  }
}

/**
 * AI Trade Suggester
 * Suggests one up/one down combination for trades
 */
export async function ai_trade_suggester() {
  return executeAITool('ai_trade_suggester');
}

/**
 * AI Captain Advisor
 * Recommends top 3 captains based on average and volatility
 */
export async function ai_captain_advisor() {
  return executeAITool('ai_captain_advisor');
}

/**
 * Team Structure Analyzer
 * Provides a summary of team structure by price tiers
 */
export async function team_structure_analyzer() {
  return executeAITool('team_structure_analyzer');
}

/**
 * Ownership Risk Monitor
 * Flags common high-priced underperformers
 */
export async function ownership_risk_monitor() {
  return executeAITool('ownership_risk_monitor');
}

/**
 * Form vs Price Scanner
 * Identifies over- or under-valued players
 */
export async function form_vs_price_scanner() {
  return executeAITool('form_vs_price_scanner');
}