# Landing Page Redesign - Testing Guide

## Quick Start Testing

### 1. Visual Inspection Checklist

**Desktop (1920x1080)**
- [ ] Hero section displays full-width blue gradient
- [ ] 4 benefit cards are visible without scrolling
- [ ] Both CTAs are clearly visible and properly styled
- [ ] "How It Works" section shows 3 cards side-by-side
- [ ] Industry cards show 4 across in a row
- [ ] Dashboard metrics show 3 cards side-by-side
- [ ] Security card shows 2 columns (text + lock icon)

**Tablet (768px)**
- [ ] Hero text is readable (h4 size)
- [ ] Benefit cards wrap to 2x2 grid
- [ ] "How It Works" cards stack vertically
- [ ] Industry cards show 2 across
- [ ] Dashboard metrics show 2 across
- [ ] Security card shows 2 columns

**Mobile (375px)**
- [ ] All text is readable at mobile sizes
- [ ] CTAs stack vertically or wrap
- [ ] All cards stack vertically
- [ ] Touch targets are >44px
- [ ] No horizontal scrolling

---

### 2. Interaction Testing

**Hero Section**
- [ ] "See It In Action" button triggers quick start flow
- [ ] "Upload Your Data" button navigates to Upload tab
- [ ] Hover effects work on CTAs (scale animation)
- [ ] Button is disabled during loading
- [ ] Loading spinner appears during quick start

**How It Works Cards**
- [ ] Clicking card 1 navigates to Upload tab
- [ ] Clicking card 2 navigates to Predictions tab
- [ ] Clicking card 3 navigates to Analytics tab
- [ ] Hover effect lifts card and adds shadow
- [ ] Cards are keyboard-accessible (Tab key)

**Industry Cards**
- [ ] All 4 industry cards display correctly
- [ ] Icons have distinct colors
- [ ] Hover effect adds shadow
- [ ] "Sample Available" chips are visible

**Dashboard Metrics**
- [ ] Cards show correct counts
- [ ] Empty state shows helpful text
- [ ] Populated state shows green border
- [ ] Clicking cards navigates to correct tab
- [ ] Hover effect lifts card

**Security Card**
- [ ] All 4 trust signals visible
- [ ] Check marks are green
- [ ] Lock icon displays on right
- [ ] Text is readable on gray background

---

### 3. Accessibility Testing

**Keyboard Navigation**
- [ ] Tab key moves through all interactive elements
- [ ] Enter/Space activates buttons and cards
- [ ] Focus indicators are visible
- [ ] Skip link works (if present)

**Screen Reader**
- [ ] Hero headline reads as H1
- [ ] Section headings read as H2
- [ ] Card headings read as H3
- [ ] ARIA labels on metrics announce counts
- [ ] All images have alt text or are decorative

**Color Contrast**
- [ ] Hero text on blue: >7:1 contrast (AAA)
- [ ] Body text: >4.5:1 contrast (AA)
- [ ] Button text: >4.5:1 contrast
- [ ] Disabled states are distinguishable

**WCAG 2.1 AA Compliance**
- [ ] All interactive elements have focus states
- [ ] No information conveyed by color alone
- [ ] Text can be resized to 200% without loss of content
- [ ] Touch targets are at least 44x44px

---

### 4. Functional Testing

**Quick Start Flow**
- [ ] "See It In Action" starts quick start
- [ ] Alert banner shows "Step 1 of 3"
- [ ] Sample data loads successfully
- [ ] Alert updates to "Step 2 of 3"
- [ ] Alert updates to "Step 3 of 3" with CTAs
- [ ] Clicking "Upload My Data" completes flow and switches tab
- [ ] Clicking "I'll Do This Later" completes flow
- [ ] Completion badge appears after flow
- [ ] Quick start CTA hides after completion

**Dashboard State**
- [ ] Empty state shows "Upload your first file to begin"
- [ ] File count updates after upload
- [ ] Predictions count updates after analysis
- [ ] Insights count updates after analysis
- [ ] Green borders appear when counts > 0
- [ ] Contextual text changes based on state

**Navigation**
- [ ] Clicking dashboard cards switches active tab
- [ ] How It Works cards navigate correctly
- [ ] "Upload Your Data" CTA switches to Upload tab
- [ ] Browser back button works correctly

---

### 5. Performance Testing

**Load Time**
- [ ] Page renders in <2 seconds on 3G
- [ ] No layout shift during initial load
- [ ] Images/icons load progressively
- [ ] No blocking resources

**Bundle Size**
- [ ] Check build output: `npm run build`
- [ ] Gzip size increase: <10kB acceptable
- [ ] No new dependencies added
- [ ] Chart.js still lazy-loaded

**Runtime Performance**
- [ ] Hover animations are smooth (60fps)
- [ ] Tab switching is instant
- [ ] No console errors
- [ ] No console warnings (except pre-existing)

---

### 6. Cross-Browser Testing

**Desktop Browsers**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Mobile Browsers**
- [ ] iOS Safari
- [ ] Chrome Mobile (Android)
- [ ] Samsung Internet

**Things to Check:**
- [ ] Blue gradient renders correctly
- [ ] Hover effects work (or are disabled on touch)
- [ ] Flex layouts work consistently
- [ ] Border radius displays correctly
- [ ] Typography renders properly

---

### 7. User Testing Script

**Task 1: Value Comprehension (5 seconds)**
> "Look at this page for 5 seconds, then tell me: What does this product do?"

**Expected Answer:** "Forecasting/predictions for business" or similar
**Success:** User understands core value proposition

---

**Task 2: Trust Evaluation**
> "Would you feel comfortable uploading your business data to this platform? Why or why not?"

**Expected Answer:** Mentions security, privacy, or trust signals
**Success:** User notices and trusts security messaging

---

**Task 3: Industry Fit**
> "Do you think this product is right for your type of business?"

**Expected Answer:** References industry cards or specific use case
**Success:** User sees themselves in the product

---

**Task 4: Next Action**
> "What would you click next? Why?"

**Expected Answer:** Either "See It In Action" (low commitment) or "Upload Your Data" (ready to start)
**Success:** User knows what to do next

---

**Task 5: Comprehension**
> "Explain how this product works, based on what you see."

**Expected Answer:** Mentions 3-step process or similar
**Success:** User understands the workflow

---

### 8. A/B Testing Setup (Optional)

If you have sufficient traffic, set up an A/B test:

**Variant A (Control):** Old design
**Variant B (Treatment):** New design

**Primary Metric:**
- Demo completion rate (clicks "See It In Action" + completes flow)

**Secondary Metrics:**
- Bounce rate
- Time on page
- Upload rate (% who upload data in first session)
- Tab switches (engagement)

**Sample Size:**
- Minimum 100 conversions per variant for statistical significance
- Run for at least 1 week to account for day-of-week effects

**Success Criteria:**
- >15% increase in demo completion (statistically significant)
- <40% bounce rate
- >20s average time on page

---

### 9. Lighthouse Audit

**Run in Chrome DevTools:**
1. Open Chrome DevTools (F12)
2. Navigate to "Lighthouse" tab
3. Select "Desktop" or "Mobile"
4. Select all categories
5. Click "Generate report"

**Target Scores:**
- Performance: >85
- Accessibility: >95
- Best Practices: >90
- SEO: >90

**Common Issues to Check:**
- Largest Contentful Paint (LCP): <2.5s
- First Input Delay (FID): <100ms
- Cumulative Layout Shift (CLS): <0.1
- Time to Interactive (TTI): <3.8s

---

### 10. Bug Reporting Template

If you find a bug, report it with:

**Environment:**
- Browser: [Chrome 120, Firefox 121, Safari 17, etc.]
- Device: [Desktop, iPhone 14, Galaxy S22, etc.]
- Screen Size: [1920x1080, 375x667, etc.]
- OS: [macOS 14, Windows 11, iOS 17, Android 13, etc.]

**Steps to Reproduce:**
1. Navigate to Overview tab
2. Click [specific element]
3. Observe [issue]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshot/Video:**
[Attach if possible]

**Severity:**
- Critical: Blocks core functionality
- High: Major visual/UX issue
- Medium: Minor issue, has workaround
- Low: Cosmetic issue

---

### 11. Accessibility Tools

**Automated Testing:**
- axe DevTools (Chrome extension)
- WAVE (Web Accessibility Evaluation Tool)
- Lighthouse Accessibility audit

**Manual Testing:**
- Keyboard-only navigation (unplug mouse!)
- Screen reader (VoiceOver on Mac, NVDA on Windows)
- Zoom to 200% (browser zoom)
- High contrast mode (Windows)

**Quick Checks:**
- All interactive elements reachable by keyboard?
- Focus indicators visible?
- Images have alt text?
- Headings in logical order (H1 → H2 → H3)?
- Form inputs have labels?

---

### 12. Regression Testing

**Ensure existing features still work:**
- [ ] Upload tab functions correctly
- [ ] Predictions tab shows results
- [ ] Analytics tab displays insights
- [ ] Quick start flow completes
- [ ] File drag-and-drop works
- [ ] Sample data loads
- [ ] Comparison mode functions
- [ ] Export/share features work
- [ ] Scheduled reports function

---

### 13. Mobile-Specific Testing

**Gestures:**
- [ ] Tap targets are >44px
- [ ] Scroll is smooth
- [ ] No accidental clicks
- [ ] Pinch-to-zoom works (if enabled)

**Orientation:**
- [ ] Portrait mode displays correctly
- [ ] Landscape mode displays correctly
- [ ] Switching orientation doesn't break layout

**Network:**
- [ ] Works on slow 3G
- [ ] Works offline (shows error gracefully)
- [ ] Images load progressively

---

### 14. User Feedback Collection

**Post-Test Survey (5 questions):**

1. "On a scale of 1-5, how clear is the product's value?"
   - 1 = Very unclear
   - 5 = Very clear

2. "Would you trust this platform with your business data?"
   - Yes / No / Maybe
   - (Follow-up: Why or why not?)

3. "Which industry card resonated most with you?"
   - Coffee Shops / Restaurants / Retail / Service / None

4. "What would make you more likely to try this product?"
   - (Open-ended)

5. "Any other feedback or suggestions?"
   - (Open-ended)

---

### 15. Success Metrics Dashboard

Track these metrics weekly:

| Metric                     | Week 1 | Week 2 | Week 3 | Week 4 | Target |
|----------------------------|--------|--------|--------|--------|--------|
| Bounce Rate                |        |        |        |        | <40%   |
| Avg Time on Page           |        |        |        |        | >20s   |
| Demo Completion Rate       |        |        |        |        | >10%   |
| Upload Rate                |        |        |        |        | >8%    |
| Tab Switches (engagement)  |        |        |        |        | >2     |
| Clarity Score (user survey)|        |        |        |        | >4.0   |

---

## Quick Smoke Test (5 minutes)

**Run this before any deployment:**

1. ✅ Open app in browser
2. ✅ Verify hero section displays
3. ✅ Click "See It In Action" → Completes quick start
4. ✅ Click "Upload Your Data" → Navigates to Upload tab
5. ✅ Click dashboard card → Navigates to correct tab
6. ✅ Resize to mobile → Layout adapts
7. ✅ Tab through page → All elements accessible
8. ✅ Check console → No errors

**Pass?** ✅ Safe to deploy
**Fail?** ❌ Debug and re-test

---

## Rollback Plan

If critical issues are found in production:

1. **Immediate:** Revert commit in Git
2. **Rebuild:** `npm run build`
3. **Redeploy:** Push to production
4. **Verify:** Run smoke test
5. **Investigate:** Debug issue in staging
6. **Re-release:** Fix and re-deploy when ready

**Rollback Commit:**
```bash
git revert HEAD
git push origin main
```

---

## Files Modified

- `/frontend/src/App.tsx` - `renderOverview()` function
- No other files affected
- No dependencies added
- Build size: +1.51 kB (acceptable)

---

## Contact

**For questions or issues:**
- Review full summary: `/LANDING_PAGE_REDESIGN_SUMMARY.md`
- Visual comparison: `/frontend/LANDING_PAGE_BEFORE_AFTER.md`

---

**Last Updated:** 2025-11-08
**Status:** Ready for Testing
