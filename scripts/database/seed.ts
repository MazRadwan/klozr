import { db } from '../src/lib/db';
import { companies, contacts, users, sales_reps, offerings, deals, communications } from '../src/lib/schema';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    db.delete(communications).run();
    db.delete(deals).run();
    db.delete(contacts).run();
    db.delete(sales_reps).run();
    db.delete(offerings).run();
    db.delete(companies).run();
    db.delete(users).run();

    // 1. Create Users
    console.log('👥 Creating users...');
    const userData = [
      {
        username: 'john.smith',
        email: 'john.smith@company.com',
        password_hash: 'hashed_password_123',
        role: 'sales_rep',
        is_active: true
      },
      {
        username: 'sarah.johnson',
        email: 'sarah.johnson@company.com',
        password_hash: 'hashed_password_456',
        role: 'sales_manager',
        is_active: true
      },
      {
        username: 'mike.davis',
        email: 'mike.davis@company.com',
        password_hash: 'hashed_password_789',
        role: 'sales_rep',
        is_active: true
      },
      {
        username: 'emma.wilson',
        email: 'emma.wilson@company.com',
        password_hash: 'hashed_password_101',
        role: 'sales_rep',
        is_active: true
      }
    ];

    const userResults = userData.map(user => 
      db.insert(users).values(user).returning({ id: users.id }).get()
    );
    console.log(`✅ Created ${userResults.length} users`);

    // 2. Create Sales Reps
    console.log('💼 Creating sales reps...');
    const salesRepData = [
      {
        user_id: userResults[0].id,
        manager_id: userResults[1].id,
        region: 'West Coast',
        hire_date: '2023-01-15',
        is_active: true
      },
      {
        user_id: userResults[1].id,
        manager_id: null, // Manager has no manager
        region: 'National',
        hire_date: '2022-03-10',
        is_active: true
      },
      {
        user_id: userResults[2].id,
        manager_id: userResults[1].id,
        region: 'East Coast',
        hire_date: '2023-06-20',
        is_active: true
      },
      {
        user_id: userResults[3].id,
        manager_id: userResults[1].id,
        region: 'Midwest',
        hire_date: '2024-01-08',
        is_active: true
      }
    ];

    const salesRepResults = salesRepData.map(rep => 
      db.insert(sales_reps).values(rep).returning({ id: sales_reps.id }).get()
    );
    console.log(`✅ Created ${salesRepResults.length} sales reps`);

    // 3. Create Offerings
    console.log('📦 Creating offerings...');
    const offeringData = [
      {
        name: 'Enterprise CRM Platform',
        description: 'Full-featured customer relationship management platform for large enterprises',
        type: 'Software',
        price: 15000.00
      },
      {
        name: 'Sales Analytics Dashboard',
        description: 'Advanced analytics and reporting tools for sales teams',
        type: 'Software',
        price: 8500.00
      },
      {
        name: 'Implementation Services',
        description: 'Professional services for platform implementation and training',
        type: 'Service',
        price: 25000.00
      },
      {
        name: 'Marketing Automation Suite',
        description: 'Automated marketing campaigns and lead nurturing tools',
        type: 'Software',
        price: 12000.00
      },
      {
        name: 'Customer Support Portal',
        description: 'Self-service customer support and ticketing system',
        type: 'Software',
        price: 6000.00
      }
    ];

    const offeringResults = offeringData.map(offering => 
      db.insert(offerings).values(offering).returning({ id: offerings.id }).get()
    );
    console.log(`✅ Created ${offeringResults.length} offerings`);

    // 4. Create Companies
    console.log('🏢 Creating companies...');
    const companyData = [
      {
        name: 'TechCorp Solutions',
        website: 'techcorp.com',
        address: '123 Innovation Drive',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        phone: '+1 (555) 123-4567',
        email: 'contact@techcorp.com',
        industry: 'Technology',
        description: 'Leading provider of enterprise software solutions',
        employees: 500,
        revenue: '$50M - $100M',
        founded: '2015'
      },
      {
        name: 'Global Manufacturing Inc',
        website: 'globalmanufacturing.com',
        address: '456 Industrial Blvd',
        city: 'Detroit',
        state: 'MI',
        country: 'USA',
        phone: '+1 (555) 234-5678',
        email: 'info@globalmanufacturing.com',
        industry: 'Manufacturing',
        description: 'Multinational manufacturing corporation specializing in automotive parts',
        employees: 2500,
        revenue: '$500M - $1B',
        founded: '1985'
      },
      {
        name: 'HealthTech Innovations',
        website: 'healthtech-innovations.com',
        address: '789 Medical Plaza',
        city: 'Boston',
        state: 'MA',
        country: 'USA',
        phone: '+1 (555) 345-6789',
        email: 'contact@healthtech-innovations.com',
        industry: 'Healthcare',
        description: 'Cutting-edge medical technology and digital health solutions',
        employees: 150,
        revenue: '$10M - $25M',
        founded: '2019'
      },
      {
        name: 'Financial Partners Group',
        website: 'financialpartners.com',
        address: '321 Wall Street',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        phone: '+1 (555) 456-7890',
        email: 'partners@financialpartners.com',
        industry: 'Financial Services',
        description: 'Investment management and financial advisory services',
        employees: 75,
        revenue: '$25M - $50M',
        founded: '2010'
      },
      {
        name: 'Green Energy Solutions',
        website: 'greenenergysolutions.com',
        address: '654 Renewable Way',
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        phone: '+1 (555) 567-8901',
        email: 'info@greenenergysolutions.com',
        industry: 'Energy',
        description: 'Renewable energy consulting and solar installation services',
        employees: 200,
        revenue: '$15M - $30M',
        founded: '2018'
      },
      {
        name: 'RetailMax Corporation',
        website: 'retailmax.com',
        address: '987 Commerce Street',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        phone: '+1 (555) 678-9012',
        email: 'corporate@retailmax.com',
        industry: 'Retail',
        description: 'National retail chain with focus on consumer electronics',
        employees: 5000,
        revenue: '$1B+',
        founded: '1995'
      }
    ];

    const companyResults = companyData.map(company => 
      db.insert(companies).values(company).returning({ id: companies.id }).get()
    );
    console.log(`✅ Created ${companyResults.length} companies`);

    // 5. Create Contacts
    console.log('👤 Creating contacts...');
    const contactData = [
      // TechCorp Solutions contacts
      {
        first_name: 'Jennifer',
        last_name: 'Chen',
        email: 'jennifer.chen@techcorp.com',
        phone: '+1 (555) 123-4501',
        contact_type: 'CEO',
        company_id: companyResults[0].id,
        owner_user_id: userResults[0].id,
        address: '123 Innovation Drive',
        city: 'San Francisco',
        state_province: 'CA',
        postal_code: '94105'
      },
      {
        first_name: 'David',
        last_name: 'Rodriguez',
        email: 'david.rodriguez@techcorp.com',
        phone: '+1 (555) 123-4502',
        contact_type: 'CTO',
        company_id: companyResults[0].id,
        owner_user_id: userResults[0].id,
        address: '123 Innovation Drive',
        city: 'San Francisco',
        state_province: 'CA',
        postal_code: '94105'
      },
      
      // Global Manufacturing contacts
      {
        first_name: 'Robert',
        last_name: 'Thompson',
        email: 'robert.thompson@globalmanufacturing.com',
        phone: '+1 (555) 234-5601',
        contact_type: 'VP of Operations',
        company_id: companyResults[1].id,
        owner_user_id: userResults[2].id,
        address: '456 Industrial Blvd',
        city: 'Detroit',
        state_province: 'MI',
        postal_code: '48201'
      },
      {
        first_name: 'Lisa',
        last_name: 'Anderson',
        email: 'lisa.anderson@globalmanufacturing.com',
        phone: '+1 (555) 234-5602',
        contact_type: 'IT Director',
        company_id: companyResults[1].id,
        owner_user_id: userResults[2].id,
        address: '456 Industrial Blvd',
        city: 'Detroit',
        state_province: 'MI',
        postal_code: '48201'
      },

      // HealthTech Innovations contacts
      {
        first_name: 'Dr. Michael',
        last_name: 'Foster',
        email: 'michael.foster@healthtech-innovations.com',
        phone: '+1 (555) 345-6701',
        contact_type: 'Chief Medical Officer',
        company_id: companyResults[2].id,
        owner_user_id: userResults[3].id,
        address: '789 Medical Plaza',
        city: 'Boston',
        state_province: 'MA',
        postal_code: '02115'
      },
      {
        first_name: 'Sarah',
        last_name: 'Kim',
        email: 'sarah.kim@healthtech-innovations.com',
        phone: '+1 (555) 345-6702',
        contact_type: 'Product Manager',
        company_id: companyResults[2].id,
        owner_user_id: userResults[3].id,
        address: '789 Medical Plaza',
        city: 'Boston',
        state_province: 'MA',
        postal_code: '02115'
      },

      // Financial Partners Group contacts
      {
        first_name: 'James',
        last_name: 'Wilson',
        email: 'james.wilson@financialpartners.com',
        phone: '+1 (555) 456-7801',
        contact_type: 'Managing Partner',
        company_id: companyResults[3].id,
        owner_user_id: userResults[0].id,
        address: '321 Wall Street',
        city: 'New York',
        state_province: 'NY',
        postal_code: '10005'
      },

      // Green Energy Solutions contacts
      {
        first_name: 'Maria',
        last_name: 'Garcia',
        email: 'maria.garcia@greenenergysolutions.com',
        phone: '+1 (555) 567-8901',
        contact_type: 'Business Development Director',
        company_id: companyResults[4].id,
        owner_user_id: userResults[2].id,
        address: '654 Renewable Way',
        city: 'Austin',
        state_province: 'TX',
        postal_code: '78701'
      },

      // RetailMax Corporation contacts
      {
        first_name: 'Kevin',
        last_name: 'Brown',
        email: 'kevin.brown@retailmax.com',
        phone: '+1 (555) 678-9001',
        contact_type: 'VP of Technology',
        company_id: companyResults[5].id,
        owner_user_id: userResults[1].id,
        address: '987 Commerce Street',
        city: 'Chicago',
        state_province: 'IL',
        postal_code: '60601'
      },
      {
        first_name: 'Amanda',
        last_name: 'Taylor',
        email: 'amanda.taylor@retailmax.com',
        phone: '+1 (555) 678-9002',
        contact_type: 'Chief Information Officer',
        company_id: companyResults[5].id,
        owner_user_id: userResults[1].id,
        address: '987 Commerce Street',
        city: 'Chicago',
        state_province: 'IL',
        postal_code: '60601'
      }
    ];

    const contactResults = contactData.map(contact => 
      db.insert(contacts).values(contact).returning({ id: contacts.id }).get()
    );
    console.log(`✅ Created ${contactResults.length} contacts`);

    // 6. Create Deals
    console.log('💰 Creating deals...');
    const dealData = [
      {
        title: 'TechCorp Enterprise CRM Implementation',
        amount: 45000.00,
        stage: 'Proposal',
        close_date: '2024-07-15',
        contact_id: contactResults[0].id, // Jennifer Chen - CEO
        company_id: companyResults[0].id, // TechCorp Solutions
        sales_rep_id: salesRepResults[0].id, // John Smith
        offering_id: offeringResults[0].id, // Enterprise CRM Platform
        deal_notes: 'Large enterprise deal with potential for additional modules. CEO is very interested in the analytics capabilities.'
      },
      {
        title: 'TechCorp Analytics Dashboard',
        amount: 8500.00,
        stage: 'Negotiation',
        close_date: '2024-06-30',
        contact_id: contactResults[1].id, // David Rodriguez - CTO
        company_id: companyResults[0].id, // TechCorp Solutions
        sales_rep_id: salesRepResults[0].id, // John Smith
        offering_id: offeringResults[1].id, // Sales Analytics Dashboard
        deal_notes: 'Add-on to main CRM deal. CTO wants advanced reporting features.'
      },
      {
        title: 'Global Manufacturing Digital Transformation',
        amount: 75000.00,
        stage: 'Qualification',
        close_date: '2024-09-30',
        contact_id: contactResults[2].id, // Robert Thompson - VP Operations
        company_id: companyResults[1].id, // Global Manufacturing
        sales_rep_id: salesRepResults[2].id, // Mike Davis
        offering_id: offeringResults[0].id, // Enterprise CRM Platform
        deal_notes: 'Major digital transformation initiative. Multiple stakeholders involved. Long sales cycle expected.'
      },
      {
        title: 'Global Manufacturing Implementation Services',
        amount: 25000.00,
        stage: 'Prospecting',
        close_date: '2024-10-15',
        contact_id: contactResults[3].id, // Lisa Anderson - IT Director
        company_id: companyResults[1].id, // Global Manufacturing
        sales_rep_id: salesRepResults[2].id, // Mike Davis
        offering_id: offeringResults[2].id, // Implementation Services
        deal_notes: 'Professional services package for CRM implementation. Dependent on main platform deal.'
      },
      {
        title: 'HealthTech Marketing Automation',
        amount: 12000.00,
        stage: 'Closed Won',
        close_date: '2024-03-15',
        contact_id: contactResults[4].id, // Dr. Michael Foster - CMO
        company_id: companyResults[2].id, // HealthTech Innovations
        sales_rep_id: salesRepResults[3].id, // Emma Wilson
        offering_id: offeringResults[3].id, // Marketing Automation Suite
        deal_notes: 'Successfully closed! Customer is very happy with the lead nurturing capabilities.'
      },
      {
        title: 'HealthTech Customer Support Portal',
        amount: 6000.00,
        stage: 'Proposal',
        close_date: '2024-07-01',
        contact_id: contactResults[5].id, // Sarah Kim - Product Manager
        company_id: companyResults[2].id, // HealthTech Innovations
        sales_rep_id: salesRepResults[3].id, // Emma Wilson
        offering_id: offeringResults[4].id, // Customer Support Portal
        deal_notes: 'Follow-up deal from marketing automation success. Looking to improve customer self-service.'
      },
      {
        title: 'Financial Partners CRM & Analytics Bundle',
        amount: 23500.00,
        stage: 'Negotiation',
        close_date: '2024-06-20',
        contact_id: contactResults[6].id, // James Wilson - Managing Partner
        company_id: companyResults[3].id, // Financial Partners Group
        sales_rep_id: salesRepResults[0].id, // John Smith
        offering_id: offeringResults[0].id, // Enterprise CRM Platform
        deal_notes: 'Bundled deal with analytics. Price sensitive but committed to moving forward.'
      },
      {
        title: 'Green Energy CRM Solution',
        amount: 15000.00,
        stage: 'Qualification',
        close_date: '2024-08-30',
        contact_id: contactResults[7].id, // Maria Garcia - BD Director
        company_id: companyResults[4].id, // Green Energy Solutions
        sales_rep_id: salesRepResults[2].id, // Mike Davis
        offering_id: offeringResults[0].id, // Enterprise CRM Platform
        deal_notes: 'Growing company needs better lead management. Interested in solar industry specific features.'
      },
      {
        title: 'RetailMax Enterprise Platform',
        amount: 50000.00,
        stage: 'Prospecting',
        close_date: '2024-12-31',
        contact_id: contactResults[8].id, // Kevin Brown - VP Technology
        company_id: companyResults[5].id, // RetailMax Corporation
        sales_rep_id: salesRepResults[1].id, // Sarah Johnson (Manager)
        offering_id: offeringResults[0].id, // Enterprise CRM Platform
        deal_notes: 'Large retail chain. Complex requirements with multiple integrations needed. High-value strategic deal.'
      },
      {
        title: 'RetailMax Implementation & Training',
        amount: 35000.00,
        stage: 'Prospecting',
        close_date: '2025-01-31',
        contact_id: contactResults[9].id, // Amanda Taylor - CIO
        company_id: companyResults[5].id, // RetailMax Corporation
        sales_rep_id: salesRepResults[1].id, // Sarah Johnson (Manager)
        offering_id: offeringResults[2].id, // Implementation Services
        deal_notes: 'Implementation services for the enterprise platform. Will require extensive training for 5000+ employees.'
      }
    ];

    const dealResults = dealData.map(deal => 
      db.insert(deals).values(deal).returning({ id: deals.id }).get()
    );
    console.log(`✅ Created ${dealResults.length} deals`);

    // 7. Create Communications/Activities
    console.log('📞 Creating communications...');
    const communicationData = [
      {
        contact_id: contactResults[0].id,
        company_id: companyResults[0].id,
        sales_rep_id: salesRepResults[0].id,
        subject: 'Initial Discovery Call - TechCorp CRM Requirements',
        body: 'Great conversation with Jennifer about TechCorp\'s current CRM challenges. They\'re using spreadsheets and need better lead tracking. Discussed enterprise platform capabilities.',
        communication_type: 'call',
        timestamp: '2024-05-15T10:30:00Z'
      },
      {
        contact_id: contactResults[0].id,
        company_id: companyResults[0].id,
        sales_rep_id: salesRepResults[0].id,
        subject: 'Follow-up Email - Enterprise CRM Demo Scheduled',
        body: 'Hi Jennifer, Thank you for the productive call yesterday. I\'ve scheduled our demo for next Tuesday at 2 PM PST. I\'ll show you the lead management and analytics features we discussed.',
        communication_type: 'email',
        timestamp: '2024-05-16T09:15:00Z'
      },
      {
        contact_id: contactResults[2].id,
        company_id: companyResults[1].id,
        sales_rep_id: salesRepResults[2].id,
        subject: 'Global Manufacturing - Digital Transformation Meeting',
        body: 'Met with Robert and the operations team. They\'re planning a major digital transformation and CRM is a key component. Need to schedule follow-up with IT team.',
        communication_type: 'meeting',
        timestamp: '2024-05-10T14:00:00Z'
      },
      {
        contact_id: contactResults[4].id,
        company_id: companyResults[2].id,
        sales_rep_id: salesRepResults[3].id,
        subject: 'HealthTech Contract Signed!',
        body: 'Excellent news! Dr. Foster has signed the contract for the Marketing Automation Suite. Implementation starts next week. Very pleased with our solution.',
        communication_type: 'email',
        timestamp: '2024-03-10T16:45:00Z'
      },
      {
        contact_id: contactResults[6].id,
        company_id: companyResults[3].id,
        sales_rep_id: salesRepResults[0].id,
        subject: 'Financial Partners - Pricing Discussion',
        body: 'James expressed concerns about the initial pricing. Discussed volume discounts and payment terms. He\'s interested in the bundled CRM + Analytics package.',
        communication_type: 'call',
        timestamp: '2024-05-20T11:00:00Z'
      },
      {
        contact_id: contactResults[8].id,
        company_id: companyResults[5].id,
        sales_rep_id: salesRepResults[1].id,
        subject: 'RetailMax - Enterprise Requirements Review',
        body: 'Initial meeting with Kevin to understand RetailMax\'s complex requirements. They need integration with existing POS systems and inventory management. Large-scale deployment.',
        communication_type: 'meeting',
        timestamp: '2024-05-01T13:30:00Z'
      }
    ];

    const communicationResults = communicationData.map(comm => 
      db.insert(communications).values(comm).returning({ id: communications.id }).get()
    );
    console.log(`✅ Created ${communicationResults.length} communications`);

    // Summary
    console.log('\n🎉 Database seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${userResults.length}`);
    console.log(`   💼 Sales Reps: ${salesRepResults.length}`);
    console.log(`   📦 Offerings: ${offeringResults.length}`);
    console.log(`   🏢 Companies: ${companyResults.length}`);
    console.log(`   👤 Contacts: ${contactResults.length}`);
    console.log(`   💰 Deals: ${dealResults.length}`);
    console.log(`   📞 Communications: ${communicationResults.length}`);
    console.log('\n✨ All data has been created with proper relationships!');

    // Show some relationship examples
    console.log('\n🔗 Relationship Examples:');
    console.log(`   • TechCorp Solutions (Company ${companyResults[0].id}) has ${contactData.filter(c => c.company_id === companyResults[0].id).length} contacts`);
    console.log(`   • Jennifer Chen (Contact ${contactResults[0].id}) has ${dealData.filter(d => d.contact_id === contactResults[0].id).length} deals`);
    console.log(`   • John Smith (Sales Rep ${salesRepResults[0].id}) owns ${dealData.filter(d => d.sales_rep_id === salesRepResults[0].id).length} deals`);
    console.log(`   • Enterprise CRM Platform (Offering ${offeringResults[0].id}) is in ${dealData.filter(d => d.offering_id === offeringResults[0].id).length} deals`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seed().catch(console.error); 