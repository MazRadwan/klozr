import { NextRequest, NextResponse } from 'next/server';
import { withAuthParamsHandler, throwError } from '@/server/lib';
import { makeCompanyService } from '@/server/services';

export const GET = withAuthParamsHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const companyId = parseInt(id);
  
  if (isNaN(companyId)) {
    throwError.badRequest('Invalid company ID');
  }
  
  const companyService = makeCompanyService();
  const company = await companyService.getCompanyById(companyId);
  
  if (!company) {
    throwError.notFound('Company not found');
  }
  
  return NextResponse.json(company);
});

export const PUT = withAuthParamsHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const companyId = parseInt(id);
  
  if (isNaN(companyId)) {
    throwError.badRequest('Invalid company ID');
  }
  
  const body = await req.json();
  const companyService = makeCompanyService();
  
  const result = await companyService.updateCompany(companyId, body);
  
  if (!result.success) {
    if (result.error === 'Company not found') {
      throwError.notFound('Company not found');
    }
    throwError.internal(`Failed to update company: ${result.error}`);
  }
  
  return NextResponse.json(result.company);
});

export const DELETE = withAuthParamsHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const companyId = parseInt(id);
  
  if (isNaN(companyId)) {
    throwError.badRequest('Invalid company ID');
  }
  
  const companyService = makeCompanyService();
  const result = await companyService.deleteCompany(companyId);
  
  if (!result.success) {
    if (result.error === 'Company not found') {
      throwError.notFound('Company not found');
    }
    throwError.internal(`Failed to delete company: ${result.error}`);
  }
  
  return NextResponse.json({ message: 'Company deleted successfully' });
}); 