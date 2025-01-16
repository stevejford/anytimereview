# AnyTime Review Development Roadmap

## Stage 1: Core Authentication & Business Owner System
- [ ] Create owner_invitations table in Supabase
- [ ] Create customer_submissions table with business isolation
- [ ] Implement admin interface for inviting business owners
- [ ] Create owner registration flow with invitation tokens
- [ ] Add business_settings table for owner configurations
- [ ] Implement basic owner dashboard
- [ ] Set up Row Level Security (RLS) policies for data isolation

## Stage 2: Form Access Control & Public Forms
- [ ] Add public/private form toggle in business settings
- [ ] Create isolated public form route (/f/[business-slug])
- [ ] Implement form visibility controls
- [ ] Add form access validation
- [ ] Create minimal public form interface
- [ ] Ensure customer data isolation between businesses

## Stage 3: Business Owner Dashboard
- [ ] Create owner settings panel
  - Form visibility controls
  - Business information management
  - Webhook configuration
- [ ] Add form management interface
- [ ] Implement form analytics (views, submissions)
- [ ] Add owner profile management
- [ ] Add customer submission history (business-specific)

## Stage 4: Enhanced Admin Controls
- [ ] Add per-business control panel
- [ ] Implement admin override capabilities
- [ ] Add business status monitoring
- [ ] Create admin analytics dashboard
- [ ] Add bulk owner invitation system
- [ ] Add data isolation audit tools

## Stage 5: Security & Performance
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Enhance error handling
- [ ] Add session management
- [ ] Implement security headers
- [ ] Add data access logging

## Stage 6: Additional Features
- [ ] Email notifications system
- [ ] Custom form styling options
- [ ] Form submission history
- [ ] Data export capabilities (business-specific only)
- [ ] API access for owners

## Database Schema Changes

### Stage 1 Schema Updates
```sql
-- Owner invitations table
CREATE TABLE owner_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    business_name TEXT NOT NULL,
    invitation_token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Business settings table
CREATE TABLE business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES client_forms(id),
    owner_id UUID REFERENCES auth.users(id),
    public_form_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer submissions table (with business isolation)
CREATE TABLE customer_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES client_forms(id) NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Row Level Security Policies
ALTER TABLE customer_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can only see their own business's submissions
CREATE POLICY "Owners see own submissions" ON customer_submissions
    FOR ALL USING (
        business_id IN (
            SELECT business_id 
            FROM business_settings 
            WHERE owner_id = auth.uid()
        )
    );

-- Policy: Admin can see all submissions
CREATE POLICY "Admins see all submissions" ON customer_submissions
    FOR ALL USING (
        auth.jwt() ? 'is_admin'
    );
```

## Route Structure

```
/admin
  └── /businesses
      ├── /invite
      └── /[business-id]
          ├── /settings
          └── /submissions

/owner
  └── /dashboard
      ├── /settings
      ├── /forms
      └── /submissions

/f/[business-slug]  (public forms)
```

## User Roles & Permissions

### Super Admin
- Full system access
- Manage business owners
- Override any settings
- View all analytics
- Can view all submissions (with business context)

### Business Owner
- Manage their business settings
- Control form visibility
- View their analytics
- Configure webhooks
- View only their business's submissions

### Public
- Access to public forms only
- Submit form entries
- No access to submission history
- No access to other businesses' data

## Data Isolation Principles
1. Each business's customer data is completely separate
2. Owners can only access their own business's data
3. Submissions are tied to specific businesses
4. RLS policies enforce data separation
5. Audit logs track all data access

## Future Considerations
- Multi-language support
- Advanced analytics
- Custom domains
- API integrations
- Mobile app development
- Enhanced data export controls 