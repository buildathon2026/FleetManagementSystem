import { Router, Request, Response } from 'express';

const router = Router();

const tools = [
  {
    name: 'get_expenses',
    method: 'GET',
    path: '/tools/expenses',
    example: '/tools/expenses?truck_id=T-084&category=parts&date_from=2026-05-01&date_to=2026-05-31'
  },
  {
    name: 'get_revenue',
    method: 'GET',
    path: '/tools/revenue',
    example: '/tools/revenue?truck_id=T-084&date_from=2026-05-01&date_to=2026-05-31'
  },
  {
    name: 'get_truck_profit',
    method: 'GET',
    path: '/tools/profit',
    example: '/tools/profit?truck_id=T-084&period=2026-05'
  },
  {
    name: 'find_document',
    method: 'GET',
    path: '/tools/documents',
    example: '/tools/documents?entity_id=T-084&doc_type=tax_form'
  },
  {
    name: 'resolve_entity',
    method: 'GET',
    path: '/tools/entity/resolve',
    example: '/tools/entity/resolve?mention=truck+84'
  },
  {
    name: 'get_upcoming_renewals',
    method: 'GET',
    path: '/tools/renewals',
    example: '/tools/renewals?days_ahead=30'
  },
  {
    name: 'get_fleet_overview',
    method: 'GET',
    path: '/tools/fleet-overview',
    example: '/tools/fleet-overview'
  }
];

router.get(['/tools', '/tools/'], (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  res.json({
    service: 'fleet-data-service',
    message: 'Use one of the MCP tool endpoints below.',
    tools: tools.map(tool => ({
      ...tool,
      url: `${baseUrl}${tool.path}`,
      example_url: `${baseUrl}${tool.example}`
    }))
  });
});

export default router;
