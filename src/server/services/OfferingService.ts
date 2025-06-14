import { db } from '@/lib/db';
import { offerings } from '@/lib/schema';

export class OfferingService {
  constructor(private readonly database = db) {}

  /**
   * Get all offerings
   */
  async getOfferings() {
    return this.database.select().from(offerings).all();
  }
}