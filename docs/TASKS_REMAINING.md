# MNotes - Remaining Tasks & Issues

**Last Updated**: January 3, 2026
**Status**: Landing Page Complete, Dashboard Needs Fixes

---

## 🚨 Critical Issues

### 1. Migrate from Supabase to Convex
**Priority**: CRITICAL 🔥
**Status**: ❌ Not Started

**Reason**: Transitioning to Convex for better real-time capabilities and developer experience

**Migration Tasks**:
- [ ] Set up Convex project and account
- [ ] Install Convex dependencies (`npm install convex`)
- [ ] Design Convex schema based on current Supabase tables:
  - [ ] Income Streams schema
  - [ ] Ideas Pipeline schema
  - [ ] Mentorship Insights schema
  - [ ] Analytics data schema
  - [ ] User data schema
- [ ] Migrate database structure to Convex
- [ ] Export existing data from Supabase
- [ ] Import data to Convex
- [ ] Rewrite service layer to use Convex:
  - [ ] `incomeStreams.service.ts` → Convex mutations/queries
  - [ ] `ideas.service.ts` → Convex mutations/queries
  - [ ] `mentorship.service.ts` → Convex mutations/queries
  - [ ] `analytics.service.ts` → Convex queries
- [ ] Update all components to use Convex hooks (`useQuery`, `useMutation`)
- [ ] Replace `src/utils/supabase.ts` with Convex setup
- [ ] Implement Convex authentication
- [ ] Update environment variables (remove Supabase vars)
- [ ] Test all CRUD operations with Convex
- [ ] Remove Supabase dependencies from package.json
- [ ] Update documentation to reflect Convex usage

**References**:
- Convex docs: https://docs.convex.dev
- Migration guide: https://docs.convex.dev/database/import

---

### 2. Upgrade AI Model to Gemini 2.0 Flash Experimental
**Priority**: HIGH ⚡
**Status**: ❌ Not Started

**Current**: `gemini-2.0-flash` (stable version)
**Target**: `gemini-2.0-flash-exp` (experimental with enhanced capabilities)

**Migration Tasks**:
- [x] ~~Check current Gemini model version in codebase~~ → Found: `gemini-2.0-flash` in `src/services/ai.service.ts:9`
- [ ] Review Gemini 2.0 Flash Experimental documentation
- [ ] Update `src/services/ai.service.ts` to use new model:
  - Current: `model: "gemini-2.0-flash"`
  - New: `model: "gemini-2.0-flash-exp"`
- [ ] Update Google AI API dependency if needed
- [ ] Test AI insights generation with new model
- [ ] Compare response quality and latency
- [ ] Update prompt engineering for better results with new model
- [ ] Test Ultra Mode with Gemini 2.0 Flash
- [ ] Update environment variables if needed
- [ ] Monitor token usage and costs with new model
- [ ] Update documentation to reflect model version

**Expected Benefits**:
- Improved response quality
- Better context understanding
- Enhanced reasoning capabilities
- Potentially lower latency

**References**:
- Gemini 2.0 Flash docs: https://ai.google.dev/gemini-api/docs/models/gemini-v2

---

### 3. Dashboard Alignment Errors
**Priority**: HIGH
**Status**: ❌ Not Started

**Issues**:
- Layout alignment problems across dashboard components
- Responsive design inconsistencies
- Component spacing and grid issues

**Affected Components**:
- Dashboard main layout
- Panel arrangements
- Card components
- Mobile responsiveness

**Action Items**:
- [ ] Audit all dashboard components for alignment issues
- [ ] Fix grid layouts and spacing
- [ ] Ensure responsive breakpoints work correctly
- [ ] Test on mobile, tablet, and desktop
- [ ] Standardize spacing using Tailwind utility classes

---

## 🎨 Landing Page

### Status: ✅ COMPLETE

**Completed**:
- [x] 11 landing page components built
- [x] Hero section with animations
- [x] Problem/Solution sections
- [x] Features showcase
- [x] Roadmap timeline
- [x] FAQ accordion
- [x] Waitlist email form
- [x] Footer
- [x] Dark mode support
- [x] Mobile responsive design
- [x] Removed Turbopack flag
- [x] Fixed routing (landing at `/`, dashboard at `/dashboard`)

**Remaining**:
- [ ] Connect waitlist form to email service (Resend/Mailchimp)
- [ ] Add real dashboard screenshots to replace placeholders
- [ ] Add analytics tracking (Plausible/PostHog)
- [ ] Create OG images for social sharing
- [ ] Add real testimonials when available

---

## 🔧 Technical Debt

### 1. Environment Variables
**Priority**: MEDIUM
**Status**: ⚠️ Partial

**Current State**:
- Placeholder Supabase credentials in `.env.local`
- Placeholder Google AI API key

**Action Items**:
- [ ] Replace with real Supabase credentials
- [ ] Replace with real Google AI API key
- [ ] Document environment setup in README
- [ ] Add `.env.example` file

### 2. Build Process
**Priority**: MEDIUM
**Status**: ⚠️ Needs Attention

**Issues**:
- Production build fails due to dashboard pages requiring Supabase
- SWC warnings on Windows ARM (suppressed but not fully resolved)

**Action Items**:
- [ ] Make dashboard pages client-only to fix SSG errors
- [ ] Test production build with real Supabase credentials
- [ ] Optimize build output size
- [ ] Add build caching

### 3. Dependencies
**Priority**: LOW
**Status**: ⚠️ Has Vulnerabilities

**Current**:
- 3 npm vulnerabilities (1 low, 1 high, 1 critical)

**Action Items**:
- [ ] Run `npm audit fix`
- [ ] Review and resolve critical vulnerabilities
- [ ] Update outdated packages

---

## 📱 Dashboard Application

### Status: ⚠️ NEEDS FIXES

**Completed**:
- [x] Core dashboard structure
- [x] Income Streams module
- [x] Ideas Pipeline module
- [x] Mentorship Insights module
- [x] Analytics Dashboard
- [x] AI Insights (basic implementation)
- [x] Supabase integration
- [x] Dark mode support

**Critical Issues**:
- [ ] **Alignment errors throughout dashboard**
- [ ] Layout inconsistencies on different screen sizes
- [ ] Panel spacing issues
- [ ] Card component alignment
- [ ] Grid system needs standardization

**Enhancement Needed**:
- [ ] Improve mobile responsiveness
- [ ] Add loading states for async operations
- [ ] Better error handling and user feedback
- [ ] Optimize database queries
- [ ] Add data validation
- [ ] Implement proper authentication flow

---

## 🤖 AI Features

### Status: ⚠️ INCOMPLETE

**Completed**:
- [x] Google Gemini integration
- [x] AI service architecture
- [x] Basic insight generation

**Remaining**:
- [ ] Complete Ultra Mode implementation
- [ ] Add more AI analysis types:
  - [ ] Revenue optimization recommendations
  - [ ] Idea scoring algorithm
  - [ ] Mentorship insight extraction
  - [ ] Predictive analytics
- [ ] Improve AI prompt engineering
- [ ] Add confidence scoring
- [ ] Cache AI responses to reduce API calls
- [ ] Handle API rate limits gracefully

---

## 📊 Features to Complete

### Content Metrics Module
**Priority**: HIGH
**Status**: ❌ Not Started

**Requirements**:
- Track content performance across platforms
- Integrate with social media APIs
- Display engagement metrics
- Show content-to-revenue correlation

**Action Items**:
- [ ] Design Content Metrics UI
- [ ] Implement data model
- [ ] Create Supabase table
- [ ] Build service layer
- [ ] Create components
- [ ] Add to dashboard navigation

### Operations Management
**Priority**: MEDIUM
**Status**: ❌ Not Started

**Requirements**:
- Track daily operations and tasks
- Monitor system health
- Display operational KPIs

**Action Items**:
- [ ] Define operations data model
- [ ] Design UI components
- [ ] Implement tracking logic
- [ ] Create dashboard panel

---

## 🔐 Authentication & Security

### Status: ❌ NOT IMPLEMENTED

**Critical Missing Features**:
- [ ] User authentication (Supabase Auth)
- [ ] Protected routes
- [ ] User registration flow
- [ ] Login/logout functionality
- [ ] Password reset
- [ ] Session management
- [ ] Row-level security (RLS) in Supabase
- [ ] API route protection

---

## 🎯 User Experience

### Improvements Needed
- [ ] Add onboarding flow for new users
- [ ] Create tutorial/help tooltips
- [ ] Add keyboard shortcuts
- [ ] Improve accessibility (ARIA labels, focus management)
- [ ] Add search functionality across modules
- [ ] Implement data export features
- [ ] Add print-friendly views

---

## 📈 Analytics & Monitoring

### Status: ❌ NOT IMPLEMENTED

**Needed**:
- [ ] Add Google Analytics or Plausible
- [ ] Track user interactions
- [ ] Monitor page performance
- [ ] Error logging and monitoring (Sentry)
- [ ] User feedback mechanism
- [ ] A/B testing infrastructure

---

## 📱 Mobile App

### Status: 📋 PLANNED (Future Phase)

**Requirements**:
- iOS and Android apps
- Offline support
- Quick capture features
- Push notifications

---

## 🔌 Integrations

### Status: 📋 PLANNED

**Priority Integrations**:
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Bank account linking (Plaid)
- [ ] Social media APIs (Twitter, LinkedIn)
- [ ] Email integration
- [ ] Zapier/Make.com webhooks

---

## 📝 Documentation

### Completed
- [x] Landing page specification
- [x] Landing page build documentation
- [x] Phase 2 completion summary
- [x] Supabase setup guide

### Remaining
- [ ] API documentation
- [ ] Component library documentation
- [ ] Deployment guide
- [ ] Contributing guidelines
- [ ] User documentation
- [ ] Video tutorials

---

## 🚀 Deployment

### Status: ❌ NOT DEPLOYED

**Action Items**:
- [ ] Choose hosting platform (Vercel recommended)
- [ ] Set up production environment
- [ ] Configure environment variables
- [ ] Set up CI/CD pipeline
- [ ] Add domain and SSL
- [ ] Configure CDN
- [ ] Set up monitoring
- [ ] Create staging environment

---

## 🧪 Testing

### Status: ❌ NO TESTS

**Critical Need**:
- [ ] Set up testing framework (Jest + React Testing Library)
- [ ] Unit tests for services
- [ ] Component tests
- [ ] Integration tests
- [ ] E2E tests (Playwright/Cypress)
- [ ] API endpoint tests
- [ ] Performance testing

---

## 💰 Monetization

### Status: 📋 PLANNED

**Action Items**:
- [ ] Define pricing tiers
- [ ] Implement subscription logic (Stripe)
- [ ] Create pricing page
- [ ] Add payment gateway
- [ ] Build billing dashboard
- [ ] Usage tracking and limits
- [ ] Upgrade/downgrade flows

---

## 📋 Immediate Next Steps (Priority Order)

1. **Migrate from Supabase to Convex** 🔥 (CRITICAL)
   - Set up Convex project
   - Design schemas based on existing tables
   - Migrate service layer to Convex mutations/queries
   - Update all components to use Convex hooks
   - Export data from Supabase and import to Convex
   - Remove Supabase dependencies

2. **Upgrade to Gemini 2.0 Flash Experimental** ⚡ (HIGH)
   - Check current model version in `ai.service.ts`
   - Update to `gemini-2.0-flash-exp`
   - Test all AI features with new model
   - Update prompt engineering if needed

3. **Fix Dashboard Alignment Issues** (HIGH)
   - Audit all components
   - Standardize spacing and layouts
   - Test responsive design

4. **Implement Authentication with Convex** (HIGH)
   - Add Convex Auth (replaces Supabase Auth)
   - Protect routes
   - Create login/signup pages

5. **Connect Landing Page Waitlist** (HIGH)
   - Integrate email service (Resend recommended)
   - Test form submission
   - Set up email notifications

6. **Fix Build Process** (HIGH)
   - Resolve production build errors
   - Update environment variables for Convex

7. **Complete Content Metrics Module** (MEDIUM)
   - Design and implement
   - Add to dashboard

8. **Add Analytics Tracking** (MEDIUM)
   - Install analytics (Plausible/PostHog)
   - Track key metrics

9. **Write Tests** (MEDIUM)
   - Set up testing infrastructure
   - Write critical path tests

10. **Deploy to Staging** (MEDIUM)
    - Set up Vercel project
    - Configure environment with Convex
    - Test deployment

---

## 📊 Progress Tracking

**Overall Completion**: ~65%

- Landing Page: 95% ✅
- Dashboard Core: 70% ⚠️
- AI Features: 40% ⚠️
- Authentication: 0% ❌
- Testing: 0% ❌
- Deployment: 0% ❌
- Documentation: 60% ⚠️

---

## 🔄 Changelog

### January 3, 2026 (Updated)
- ✅ Completed landing page (11 components)
- ✅ Fixed routing structure
- ✅ Removed Turbopack flag
- ✅ Moved documentation to `/docs`
- ⚠️ Identified dashboard alignment issues
- 📝 Created this task tracking document
- 🔥 **Added CRITICAL task: Migrate from Supabase to Convex**
- ⚡ **Added HIGH priority task: Upgrade to Gemini 2.0 Flash Experimental**
- 📋 Updated priority order for immediate next steps

---

## 💡 Future Ideas

- AI-powered content generation
- Team collaboration features
- Public profile pages
- API for third-party integrations
- Browser extension for quick capture
- Slack/Discord bot integration
- Voice capture features
- Smart notifications and reminders

---

**Note**: This is a living document. Update regularly as tasks are completed or new issues are discovered.
