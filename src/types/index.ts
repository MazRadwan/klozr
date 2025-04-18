export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Deal {
  id: string;
  title: string;
  amount: number;
  stage: string;
  probability: number;
  closeDate: string;
  customerId: string;
}
