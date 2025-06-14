import { db } from '@/lib/db';
import { companies } from '@/lib/schema';
import { like, or, eq } from 'drizzle-orm';

export class CompanyRepository {
  constructor(private readonly database = db) {}

  /**
   * Find all companies
   */
  findAll() {
    return this.database.select().from(companies).all();
  }

  /**
   * Search companies by name, phone, email, or website
   */
  search(searchTerm: string) {
    const searchPattern = `%${searchTerm}%`;
    
    return this.database.select().from(companies)
      .where(
        or(
          like(companies.name, searchPattern),
          like(companies.phone, searchPattern),
          like(companies.email, searchPattern),
          like(companies.website, searchPattern)
        )
      )
      .all();
  }

  /**
   * Find company by ID
   */
  findById(id: number) {
    const result = this.database
      .select()
      .from(companies)
      .where(eq(companies.id, id))
      .limit(1)
      .all();

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Update company by ID
   */
  update(id: number, data: any) {
    const result = this.database
      .update(companies)
      .set(data)
      .where(eq(companies.id, id))
      .run();

    if (result.changes === 0) {
      return null;
    }

    // Return the updated company
    return this.findById(id);
  }

  /**
   * Delete company by ID
   */
  delete(id: number) {
    return this.database
      .delete(companies)
      .where(eq(companies.id, id))
      .run();
  }
}