import { NextRequest, NextResponse } from "next/server";
import { makeDealService } from "@/server/services";
import { withAuthHandler } from "@/server/lib";

/**
 * GET /api/deals/kanban
 * Optional query params:
 *   company_id – restrict to company
 *   q          – search query
 * Returns array: [{ stage: string, deals: Deal[] }]
 */
export const GET = withAuthHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const stageParam = searchParams.get("stage");
  const companyIdParam = searchParams.get("company_id");
  const companyId = companyIdParam ? parseInt(companyIdParam) : undefined;

  const dealService = makeDealService();
  const deals = await dealService.getDeals({ companyId, searchQuery: q });

  // Filter by stage if specified
  let filteredDeals = deals;
  if (stageParam && stageParam !== "all") {
    filteredDeals = deals.filter(deal => deal.deal.stage === stageParam);
  }

  // Define standard stages to ensure consistent ordering
  const standardStages = ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
  
  // Group by stage (default to "Prospecting" if missing)
  const stageMap: Record<string, any[]> = {};
  
  // Initialize all standard stages
  standardStages.forEach(stage => {
    stageMap[stage] = [];
  });
  
  // Populate with actual deals
  for (const deal of filteredDeals) {
    const stage = deal.deal.stage || "Prospecting";
    if (!stageMap[stage]) {
      stageMap[stage] = [];
    }
    stageMap[stage].push(deal);
  }

  // Return only stages that have deals or all stages if no filter
  const grouped = standardStages.map(stage => ({
    stage,
    deals: stageMap[stage] || []
  })).filter(group => 
    // Show stage if it has deals, or if no specific stage filter is applied
    group.deals.length > 0 || !stageParam || stageParam === "all"
  );

  return NextResponse.json(grouped);
}); 