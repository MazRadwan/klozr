# CRITICAL BI-DIRECTIONAL OPERATIONS TEST PLAN

## ⚠️ CRITICAL WARNING
Before making ANY changes to bi-directional sync operations, ALL tests in this plan MUST pass.

## Pre-Change Test Baseline

### 1. Entity Type Change Tests

#### Company Type → Contact Inheritance
```bash
# Test: Change company type from 'lead' to 'customer'
# Expected: All related contacts also change to 'customer' + lead fields cleared

POST /api/companies/1/type
Body: { "type": "customer" }

# Verify:
GET /api/contacts?company_id=1&include_company=true
# - All contacts should have type: "customer"
# - All lead fields should be null/empty
# - Company should have type: "customer"
```

#### Contact Type → Company & Sibling Inheritance  
```bash
# Test: Change contact type from 'lead' to 'partner'
# Expected: Company + all sibling contacts change to 'partner' + lead fields cleared

POST /api/contacts/15/type  
Body: { "type": "partner" }

# Verify:
GET /api/companies/1  # Contact 15's company
GET /api/contacts?company_id=1&include_company=true
# - Company should have type: "partner"
# - All contacts should have type: "partner"  
# - All lead fields should be null/empty
```

### 2. Lead Status Sync Tests

#### Company Lead → Contact Propagation
```bash
# Test: Update company lead status
# Expected: All related contacts inherit the same lead data

PATCH /api/companies/1/lead
Body: { 
  "status": "qualified",
  "temperature": "hot", 
  "source": "website",
  "ownerId": 1
}

# Verify:
GET /api/contacts?company_id=1&include_company=true
# - All contacts should have matching lead_status, lead_temperature, lead_source
# - lead_assigned_date should be updated
```

#### Contact Lead → Company & Sibling Propagation
```bash
# Test: Update contact lead status
# Expected: Company + all sibling contacts inherit the same lead data

PATCH /api/contacts/15/lead
Body: {
  "status": "opportunity",
  "temperature": "warm"
}

# Verify:
GET /api/companies/1
GET /api/contacts?company_id=1&include_company=true
# - Company should have matching lead_status, lead_temperature
# - All sibling contacts should have matching lead data
```

### 3. Company Creation with Contact Assignment
```bash
# Test: Create company with assigned contacts
# Expected: Contacts are linked + inherit company lead data

POST /api/companies
Body: {
  "name": "Test Company",
  "type": "lead",
  "lead_status": "prospect", 
  "assignContacts": [25, 27]
}

# Verify:
GET /api/contacts?company_id=<new_company_id>&include_company=true
# - Contacts 25, 27 should be linked to new company
# - Contacts should inherit company's lead data
# - Transaction should be atomic (all or nothing)
```

### 4. Contact Association with Lead Inheritance
```bash
# Test: Link contact to company with existing lead data
# Expected: Contact inherits company's lead data

PATCH /api/contacts/25
Body: { "company_id": 1 }

# Verify:
GET /api/contacts/25?include_company=true
# - Contact should be linked to company 1
# - Contact should inherit company's lead data if applicable
```

### 5. Atomic Operation Tests

#### Promise.all() Integrity
```bash
# Test: Verify atomic updates don't leave partial state
# Method: Simulate concurrent requests to same entity

# Concurrent company type changes:
POST /api/companies/1/type (type: "customer") &
POST /api/companies/1/type (type: "partner") &

# Verify: No partial state, all related entities consistent
```

#### Transaction Rollback Test
```bash
# Test: Verify transaction rollback on failure
# Method: Create company with invalid contact assignments

POST /api/companies
Body: {
  "name": "Test Company",
  "assignContacts": [999999] # Invalid contact ID
}

# Expected: 
# - Company creation should fail completely
# - No partial data should be created
# - Database should remain consistent
```

## Browser Automation Test Scripts

### Test 1: UI Entity Type Change
```javascript
// Navigate to company list
await browser.navigate('/dashboard/companies');

// Find company with type 'lead'
// Click entity type dropdown
// Select 'customer'
// Verify UI updates correctly
// Verify API calls succeed
// Verify data consistency
```

### Test 2: UI Lead Status Change  
```javascript
// Navigate to contact detail page
await browser.navigate('/dashboard/contacts/15');

// Click lead status dropdown
// Select 'qualified'
// Verify UI updates
// Check related company/contacts also updated
```

## Performance & Consistency Tests

### 1. Concurrent Access Test
```bash
# Test: Multiple users changing same entity simultaneously
# Expected: Data consistency maintained, no race conditions
```

### 2. Large Dataset Test
```bash
# Test: Company with many contacts (50+)
# Change company type
# Verify all contacts updated within reasonable time
# Verify no timeouts or partial updates
```

## Error Handling Tests

### 1. Network Failure Simulation
```bash
# Test: API request fails mid-operation
# Expected: Graceful error handling, no partial state
```

### 2. Database Constraint Violations
```bash
# Test: Invalid data that violates database constraints
# Expected: Proper error messages, no corruption
```

## Regression Prevention

### Critical UI Components to Test After Changes:
1. **EntityTypeDropdown** in all contexts
2. **LeadStatusDropdown** in all contexts
3. **AddCompanyModal** with contact assignment
4. **Contact association** in edit forms

### API Endpoints That Must Remain Functional:
1. `/api/companies/[id]/type` - PATCH
2. `/api/contacts/[id]/type` - PATCH
3. `/api/companies/[id]/lead` - PATCH
4. `/api/contacts/[id]/lead` - PATCH
5. `/api/companies` - POST (with assignContacts)
6. `/api/contacts/[id]` - PATCH (company_id changes)

## Success Criteria

✅ **All tests pass before changes**
✅ **All tests pass after changes**  
✅ **No new errors in browser console**
✅ **No database inconsistencies**
✅ **UI updates correctly reflect data changes**
✅ **Error messages are clear and helpful**

## Emergency Rollback Plan

If ANY test fails after changes:
1. **Immediately revert all changes**
2. **Run test suite again to confirm rollback**
3. **Analyze failure before attempting fix**
4. **Do not proceed with further changes until resolved**

---

**⚠️ REMINDER: The bi-directional sync system is critical for data integrity. Any bugs could cause permanent data corruption across multiple entities. Test thoroughly!**