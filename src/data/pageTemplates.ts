import type { CanvasBlock, LogicFlowRule, PageStyleSettings } from '../types/builder';
import {
  WEB_STUDIO_BLOCK_TEMPLATES,
  createCanvasBlockFromTemplate,
} from './webStudioBlocks';
import { STUDIO_IMAGES } from '../assets/studioAssets';

export type PageTemplateCategory =
  | 'landing'
  | 'admin'
  | 'auth'
  | 'commerce'
  | 'utility';

export interface ReadyPageTemplate {
  id: string;
  name: string;
  siName: string;
  slug: string;
  category: PageTemplateCategory;
  badge: string;
  description: string;
  siDescription: string;
  accentColor: string;
  pageStyle?: PageStyleSettings;
  build: () => {
    blocks: CanvasBlock[];
    logicFlows: LogicFlowRule[];
  };
}

function makeBlock(tplId: string, overrides: Partial<CanvasBlock> = {}): CanvasBlock {
  const tpl =
    WEB_STUDIO_BLOCK_TEMPLATES.find((t) => t.id === tplId) || WEB_STUDIO_BLOCK_TEMPLATES[0];
  const base = createCanvasBlockFromTemplate(tpl);
  return {
    ...base,
    ...overrides,
    style: {
      ...(base.style || {}),
      ...(overrides.style || {}),
    },
  };
}

export const READY_PAGE_TEMPLATES: ReadyPageTemplate[] = [
  {
    id: 'tpl-page-homepage',
    name: 'Homepage',
    siName: 'Homepage (මුල් පිටුව)',
    slug: 'home',
    category: 'landing',
    badge: 'Landing',
    description: 'Navbar, Hero headline, CTA buttons, KPI stats, Feature grid, Review & Footer.',
    siDescription: 'Navbar, Hero ශීර්ෂය, CTA buttons, KPI stats, Features grid සහ Footer එක සමඟ සම්පූර්ණ මුල් පිටුව.',
    accentColor: '#6366f1',
    build: () => {
      const heroCta = makeBlock('tpl-button', {
        name: 'Get Started CTA',
        content: 'Get Started Free →',
        buttonVariant: 'primary',
        style: {
          bgColor: 'bg-indigo-600',
          customBgHex: '#4f46e5',
          textColor: 'text-white',
          borderRadius: 'rounded-xl',
          padding: 'py-3 px-6',
          textAlign: 'center',
        },
      });
      const heroTitle = makeBlock('tpl-heading', {
        name: 'Hero Headline',
        content: 'Launch Your Digital Product Faster Than Ever',
        subtitle: 'All-in-one platform to design, automate, and scale modern web applications with zero friction.',
        style: {
          fontSize: '3xl',
          fontWeight: 'extrabold',
          textAlign: 'center',
          textColor: 'text-white',
          padding: 'py-4 px-2',
        },
      });
      return {
        blocks: [
          makeBlock('tpl-navbar', {
            name: 'Top Navigation',
            content: 'NovaBrand',
            subtitle: 'Home · Features · Pricing · Login',
          }),
          makeBlock('tpl-badge', {
            name: 'Hero Eyebrow',
            content: '✨ New Version 2.0 Available',
            style: { textAlign: 'center', bgColor: 'bg-transparent' },
          }),
          heroTitle,
          heroCta,
          makeBlock('tpl-stat', {
            name: 'Growth KPI',
            content: '24,500+',
            statValue: '24,500+',
            statLabel: 'ACTIVE TEAMS BUILDING DAILY',
            subtitle: 'ACTIVE TEAMS BUILDING DAILY',
          }),
          makeBlock('tpl-grid', {
            name: 'Feature Cards Grid',
            content: 'Core Features',
            gridColumns: 3,
            options: [
              '⚡ Instant Sync · Real-time cloud updates',
              '🔒 Enterprise Auth · Role-based access control',
              '📊 Live Analytics · Built-in telemetry charts',
            ],
          }),
          makeBlock('tpl-testimonial', {
            name: 'Customer Story',
            content: 'Switching to this platform cut our launch cycle from 6 weeks down to 3 days.',
            subtitle: 'Kasun Perera',
            authorRole: 'Product Lead at LankaTech',
            authorAvatar: STUDIO_IMAGES.creatorAvatar,
          }),
          makeBlock('tpl-accordion', {
            name: 'FAQ Item',
            content: 'Can I customize every section and connect Firebase?',
            subtitle: 'Yes! Every block is 100% editable and works with Firebase, Supabase, or REST APIs.',
          }),
          makeBlock('tpl-footer', {
            name: 'Site Footer',
            content: '© 2026 NovaBrand. All rights reserved.',
            subtitle: 'Privacy · Terms · Support · Contact',
          }),
        ],
        logicFlows: [
          {
            id: `flow_${Date.now()}_hp`,
            name: 'When Get Started Clicked -> Show Welcome',
            enabled: true,
            trigger: 'when-click',
            targetBlockId: heroCta.id,
            steps: [
              {
                id: `step_${Date.now()}_hp1`,
                action: 'show-toast',
                value: 'Welcome! Navigating to next step...',
                toastType: 'success',
              },
              {
                id: `step_${Date.now()}_hp2`,
                action: 'next-page',
              },
            ],
          },
        ],
      };
    },
  },
  {
    id: 'tpl-page-admin-panel',
    name: 'Admin Panel',
    siName: 'Admin Panel (පාලන පුවරුව)',
    slug: 'admin',
    category: 'admin',
    badge: 'Dashboard',
    description: 'Admin navbar, KPI summary, Traffic chart, Users DataTable, Quick action buttons & toggles.',
    siDescription: 'Admin navbar, Revenue/Users KPI, Chart ප්‍රස්ථාර, DataTable වගු සහ Quick action controls සමඟ පාලන පුවරුව.',
    accentColor: '#10b981',
    build: () => {
      const refreshBtn = makeBlock('tpl-button', {
        name: 'Sync Admin Data Button',
        content: '↻ Sync Live Metrics',
        buttonVariant: 'primary',
        style: {
          bgColor: 'bg-indigo-600',
          customBgHex: '#059669',
          textColor: 'text-white',
          borderRadius: 'rounded-xl',
          padding: 'py-2.5 px-5',
          textAlign: 'left',
        },
      });
      const statCard = makeBlock('tpl-stat', {
        name: 'Monthly Revenue KPI',
        content: '$48,920',
        statValue: '$48,920',
        statLabel: 'MONTHLY RECURRING REVENUE (+18.4%)',
        subtitle: 'MONTHLY RECURRING REVENUE (+18.4%)',
      });
      const chartBlk = makeBlock('tpl-chart', {
        name: 'Admin Traffic Chart',
        content: 'Weekly Active Users & Orders',
        subtitle: 'Real-time admin overview',
        chartType: 'bar',
        options: ['Mon:42', 'Tue:68', 'Wed:59', 'Thu:91', 'Fri:84', 'Sat:105', 'Sun:96'],
      });
      const tableBlk = makeBlock('tpl-datatable', {
        name: 'Users & Roles Table',
        content: 'Registered Users Directory',
        subtitle: 'Manage accounts, roles & verification status',
        columnsHeader: 'User | Email | Role | Status',
        options: [
          'Amaya Silva | amaya@app.io | Super Admin | Active',
          'Nimal Fernando | nimal@app.io | Editor | Active',
          'Kavindu Raj | kavindu@app.io | Member | Pending',
          'Sarah Chen | sarah@app.io | Moderator | Active',
        ],
      });
      const maintenanceSwitch = makeBlock('tpl-switch-tile', {
        name: 'Maintenance Mode Toggle',
        content: 'Maintenance Mode',
        subtitle: 'Temporarily pause public user signups',
        isExpanded: false,
      });
      return {
        blocks: [
          makeBlock('tpl-navbar', {
            name: 'Admin Header',
            content: '⚡ Admin Control Center',
            subtitle: 'Overview · Users · Orders · Settings',
          }),
          makeBlock('tpl-row', {
            name: 'Admin Quick Toolbar',
            content: 'Dashboard Summary',
            children: [
              makeBlock('tpl-badge', {
                name: 'System Status Badge',
                content: '● All Systems Operational',
              }),
              makeBlock('tpl-notification-badge', {
                name: 'Pending Alerts',
                content: 'Admin Alerts',
                counterValue: 5,
                badgeText: '5',
              }),
            ],
          }),
          statCard,
          chartBlk,
          makeBlock('tpl-progress-bar', {
            name: 'Server Capacity Gauge',
            content: 'Cloud Storage Quota Used',
            progressValue: 64,
          }),
          tableBlk,
          maintenanceSwitch,
          refreshBtn,
        ],
        logicFlows: [
          {
            id: `flow_${Date.now()}_adm1`,
            name: 'Sync Admin Metrics Click',
            enabled: true,
            trigger: 'when-click',
            targetBlockId: refreshBtn.id,
            steps: [
              {
                id: `step_${Date.now()}_a1`,
                action: 'show-toast',
                value: 'Admin dashboard synced with latest records!',
                toastType: 'success',
              },
              {
                id: `step_${Date.now()}_a2`,
                action: 'increment-counter',
                varName: 'adminSyncCount',
                value: '1',
              },
            ],
          },
          {
            id: `flow_${Date.now()}_adm2`,
            name: 'Maintenance Switch Toggled',
            enabled: true,
            trigger: 'when-checked',
            targetBlockId: maintenanceSwitch.id,
            steps: [
              {
                id: `step_${Date.now()}_a3`,
                action: 'show-toast',
                value: 'Maintenance Mode enabled!',
                toastType: 'warning',
              },
            ],
          },
        ],
      };
    },
  },
  {
    id: 'tpl-page-google-login',
    name: 'Google Login',
    siName: 'Google Login (Sign In පිටුව)',
    slug: 'login',
    category: 'auth',
    badge: 'Auth',
    description: 'Continue with Google button, Email & Password login form, Remember Me & auto-wired login flows.',
    siDescription: 'Continue with Google button එක, Email/Password පෝරමය සහ Login backend logic සමඟ Sign In පිටුව.',
    accentColor: '#3b82f6',
    build: () => {
      const emailInput = makeBlock('tpl-email-input', {
        name: 'Login Email Input',
        content: 'Email Address',
        subtitle: 'Email Address',
        actionPayload: 'you@example.com',
        inputType: 'email',
      });
      const passInput = makeBlock('tpl-password-input', {
        name: 'Login Password Input',
        content: 'Password',
        subtitle: 'Password',
        actionPayload: 'Enter your password',
        inputType: 'password',
      });
      const googleBtn = makeBlock('tpl-button', {
        name: 'Continue with Google Button',
        content: 'G · Continue with Google',
        buttonVariant: 'secondary',
        iconName: 'globe',
        style: {
          customBgHex: '#ffffff',
          customTextHex: '#0f172a',
          fontWeight: 'bold',
          borderRadius: 'rounded-xl',
          padding: 'py-3 px-6',
          textAlign: 'center',
        },
      });
      const signInBtn = makeBlock('tpl-submit-button', {
        name: 'Email Sign In Button',
        content: 'Sign In to Account →',
        buttonVariant: 'primary',
        style: {
          customBgHex: '#2563eb',
          textColor: 'text-white',
          borderRadius: 'rounded-xl',
          padding: 'py-3 px-6',
          textAlign: 'center',
        },
      });
      const rememberCheck = makeBlock('tpl-checkbox', {
        name: 'Remember Me Checkbox',
        content: 'Keep me signed in for 30 days',
        subtitle: 'Keep me signed in for 30 days',
        isExpanded: true,
      });
      return {
        blocks: [
          makeBlock('tpl-heading', {
            name: 'Login Header',
            content: 'Welcome Back',
            subtitle: 'Sign in with Google or your email account to continue.',
            style: {
              fontSize: '2xl',
              fontWeight: 'bold',
              textAlign: 'center',
              textColor: 'text-white',
              padding: 'py-4 px-2',
            },
          }),
          googleBtn,
          makeBlock('tpl-divider', {
            name: 'Or Divider',
            content: 'OR SIGN IN WITH EMAIL',
          }),
          emailInput,
          passInput,
          rememberCheck,
          signInBtn,
          makeBlock('tpl-link', {
            name: 'Create Account Link',
            content: "Don't have an account? Create one →",
            style: { textAlign: 'center' },
          }),
        ],
        logicFlows: [
          {
            id: `flow_${Date.now()}_gauth`,
            name: 'Google OAuth Sign-In Click',
            enabled: true,
            trigger: 'when-click',
            targetBlockId: googleBtn.id,
            steps: [
              {
                id: `step_${Date.now()}_g1`,
                action: 'auth-login',
                value: 'Signed in via Google OAuth!',
              },
              {
                id: `step_${Date.now()}_g2`,
                action: 'show-toast',
                value: 'Signed in with Google successfully!',
                toastType: 'success',
              },
              {
                id: `step_${Date.now()}_g3`,
                action: 'next-page',
              },
            ],
          },
          {
            id: `flow_${Date.now()}_eauth`,
            name: 'Email Login Submit Flow',
            enabled: true,
            trigger: 'when-click',
            targetBlockId: signInBtn.id,
            steps: [
              {
                id: `step_${Date.now()}_e1`,
                action: 'validate-form',
                targetBlockId: emailInput.id,
                validationRule: 'email',
              },
              {
                id: `step_${Date.now()}_e2`,
                action: 'auth-login',
                value: 'Authenticated user session started',
              },
              {
                id: `step_${Date.now()}_e3`,
                action: 'next-page',
              },
            ],
          },
        ],
      };
    },
  },
  {
    id: 'tpl-page-signup',
    name: 'Sign Up / Register',
    siName: 'Sign Up (ලියාපදිංචි පිටුව)',
    slug: 'signup',
    category: 'auth',
    badge: 'Auth',
    description: 'Registration form with Full Name, Email, Password, Role dropdown, Terms checkbox & Google Sign Up.',
    siDescription: 'Full Name, Email, Password, Terms checkbox සහ Google Sign Up සමඟ නව ගිණුම් සෑදීමේ පිටුව.',
    accentColor: '#8b5cf6',
    build: () => {
      const nameInp = makeBlock('tpl-text-input', {
        name: 'Full Name Input',
        content: 'Full Name',
        subtitle: 'Full Name',
        actionPayload: 'Kasun Perera',
      });
      const emailInp = makeBlock('tpl-email-input', {
        name: 'Register Email',
        content: 'Work Email',
        subtitle: 'Work Email',
        actionPayload: 'kasun@company.com',
      });
      const passInp = makeBlock('tpl-password-input', {
        name: 'Create Password',
        content: 'Password (min 8 chars)',
        subtitle: 'Password',
        actionPayload: '••••••••',
      });
      const roleSelect = makeBlock('tpl-select', {
        name: 'Account Role Select',
        content: 'Select Account Type',
        subtitle: 'Account Type',
        options: ['Creator / Individual', 'Startup Team', 'Enterprise Admin'],
      });
      const termsCb = makeBlock('tpl-checkbox', {
        name: 'Accept Terms Checkbox',
        content: 'I agree to the Terms of Service & Privacy Policy',
        subtitle: 'Accept Terms',
      });
      const submitBtn = makeBlock('tpl-submit-button', {
        name: 'Create Account Button',
        content: 'Create Free Account',
        style: {
          customBgHex: '#7c3aed',
          textColor: 'text-white',
          borderRadius: 'rounded-xl',
          padding: 'py-3 px-6',
          textAlign: 'center',
        },
      });
      return {
        blocks: [
          makeBlock('tpl-heading', {
            name: 'Register Headline',
            content: 'Create Your Account',
            subtitle: 'Start building in under 60 seconds. No credit card required.',
            style: { fontSize: '2xl', fontWeight: 'bold', textAlign: 'center' },
          }),
          makeBlock('tpl-button', {
            name: 'Sign Up with Google',
            content: 'G · Sign up with Google',
            style: {
              customBgHex: '#ffffff',
              customTextHex: '#0f172a',
              fontWeight: 'bold',
              borderRadius: 'rounded-xl',
              padding: 'py-2.5 px-5',
              textAlign: 'center',
            },
          }),
          nameInp,
          emailInp,
          passInp,
          roleSelect,
          termsCb,
          submitBtn,
        ],
        logicFlows: [
          {
            id: `flow_${Date.now()}_reg`,
            name: 'Register Account Flow',
            enabled: true,
            trigger: 'when-click',
            targetBlockId: submitBtn.id,
            steps: [
              {
                id: `step_${Date.now()}_r1`,
                action: 'validate-form',
                targetBlockId: emailInp.id,
                validationRule: 'email',
              },
              {
                id: `step_${Date.now()}_r2`,
                action: 'auth-signup',
                value: 'Account created successfully!',
              },
              {
                id: `step_${Date.now()}_r3`,
                action: 'db-save',
                collectionName: 'users',
              },
            ],
          },
        ],
      };
    },
  },
  {
    id: 'tpl-page-ecommerce',
    name: 'E-Commerce Store',
    siName: 'Online Store (වෙළඳසැල)',
    slug: 'store',
    category: 'commerce',
    badge: 'Shop',
    description: 'Store header, featured product carousel, item grid, quantity counter & checkout card.',
    siDescription: 'Store header, Product showcase carousel, Item grid, Quantity counter සහ Checkout පිටුව.',
    accentColor: '#f59e0b',
    build: () => {
      const qtyCounter = makeBlock('tpl-counter-button', {
        name: 'Cart Quantity Counter',
        content: 'Item Quantity',
        counterValue: 1,
      });
      const buyBtn = makeBlock('tpl-button', {
        name: 'Order Now Button',
        content: '🛒 Place Order Now',
        style: {
          customBgHex: '#d97706',
          textColor: 'text-white',
          borderRadius: 'rounded-xl',
          padding: 'py-3 px-6',
          textAlign: 'center',
        },
      });
      return {
        blocks: [
          makeBlock('tpl-navbar', {
            name: 'Store Navigation',
            content: '🛍️ LuxeStore',
            subtitle: 'Shop · New Arrivals · Cart · Orders',
          }),
          makeBlock('tpl-carousel', {
            name: 'Featured Deals Carousel',
            content: 'Season Sale · Up to 40% Off',
            options: [
              'Pro Wireless Studio Headphones — $199',
              'Smart Mechanical Keyboard — $149',
              'UltraSharp 4K Creator Monitor — $499',
            ],
          }),
          makeBlock('tpl-grid', {
            name: 'Product Catalog Grid',
            content: 'Popular Products',
            gridColumns: 2,
            options: [
              '🎧 Studio Headphones · $199',
              '⌚ Smart Watch Ultra · $299',
              '⌨️ Aluminum Keyboard · $149',
              '📷 Mirrorless Lens Kit · $649',
            ],
          }),
          qtyCounter,
          makeBlock('tpl-credit-card', {
            name: 'Express Card Checkout',
            content: 'Payment Method',
          }),
          buyBtn,
        ],
        logicFlows: [
          {
            id: `flow_${Date.now()}_shop`,
            name: 'Checkout Order Flow',
            enabled: true,
            trigger: 'when-click',
            targetBlockId: buyBtn.id,
            steps: [
              {
                id: `step_${Date.now()}_s1`,
                action: 'db-save',
                collectionName: 'orders',
              },
              {
                id: `step_${Date.now()}_s2`,
                action: 'show-toast',
                value: 'Order placed! Confirmation sent to your email.',
                toastType: 'success',
              },
            ],
          },
        ],
      };
    },
  },
  {
    id: 'tpl-page-analytics',
    name: 'Analytics Dashboard',
    siName: 'Analytics (දත්ත විශ්ලේෂණ)',
    slug: 'analytics',
    category: 'admin',
    badge: 'Reports',
    description: 'KPI metrics, Line chart, Conversion progress bars, Period filter dropdown & DataTable.',
    siDescription: 'KPI metrics, ප්‍රස්ථාර, Progress bars සහ DataTable සහිත Analytics වාර්තා පිටුව.',
    accentColor: '#06b6d4',
    build: () => ({
      blocks: [
        makeBlock('tpl-navbar', {
          name: 'Analytics Header',
          content: '📈 Analytics & Reports',
          subtitle: 'Overview · Revenue · Funnels · Export',
        }),
        makeBlock('tpl-select', {
          name: 'Date Range Filter',
          content: 'Reporting Window',
          subtitle: 'Reporting Window',
          options: ['Last 7 Days', 'Last 30 Days', 'This Quarter', 'Year to Date'],
        }),
        makeBlock('tpl-stat', {
          name: 'Conversion Rate KPI',
          content: '4.86%',
          statValue: '4.86%',
          statLabel: 'CHECKOUT CONVERSION RATE (+1.2%)',
          subtitle: 'CHECKOUT CONVERSION RATE (+1.2%)',
        }),
        makeBlock('tpl-chart', {
          name: 'Revenue Growth Curve',
          content: 'Monthly Revenue ($k)',
          chartType: 'line',
          options: ['Jan:18', 'Feb:24', 'Mar:31', 'Apr:29', 'May:44', 'Jun:58'],
        }),
        makeBlock('tpl-progress-bar', {
          name: 'Quarterly Target Progress',
          content: 'Q4 Goal Completion',
          progressValue: 82,
        }),
        makeBlock('tpl-datatable', {
          name: 'Top Traffic Channels',
          content: 'Acquisition Breakdown',
          columnsHeader: 'Channel | Visits | Conversions | Revenue',
          options: [
            'Google Search | 14,200 | 640 | $24,800',
            'Direct & Social | 8,950 | 380 | $14,200',
            'Email Campaigns | 4,120 | 290 | $9,920',
          ],
        }),
      ],
      logicFlows: [],
    }),
  },
  {
    id: 'tpl-page-profile',
    name: 'Profile & Settings',
    siName: 'Profile & Settings (ගිණුම)',
    slug: 'settings',
    category: 'utility',
    badge: 'Account',
    description: 'User avatar, display name & bio inputs, notification switches, preference chips & Save button.',
    siDescription: 'Profile avatar, නම/විස්තර, Notification switches සහ Save settings button එක සමඟ ගිණුම් පිටුව.',
    accentColor: '#ec4899',
    build: () => {
      const saveBtn = makeBlock('tpl-button', {
        name: 'Save Profile Settings',
        content: 'Save Preferences',
        style: {
          customBgHex: '#db2777',
          textColor: 'text-white',
          borderRadius: 'rounded-xl',
          padding: 'py-2.5 px-6',
          textAlign: 'center',
        },
      });
      return {
        blocks: [
          makeBlock('tpl-avatar', {
            name: 'User Profile Avatar',
            content: 'Deepal Priyanjith',
            subtitle: 'Product Architect · Colombo, LK',
            imageUrl: STUDIO_IMAGES.creatorAvatar,
          }),
          makeBlock('tpl-text-input', {
            name: 'Display Name Input',
            content: 'Display Name',
            subtitle: 'Display Name',
            actionPayload: 'Deepal Priyanjith',
          }),
          makeBlock('tpl-textarea', {
            name: 'Bio Input',
            content: 'About / Bio',
            subtitle: 'About / Bio',
            actionPayload: 'Building modern visual software & cloud apps.',
          }),
          makeBlock('tpl-switch-tile', {
            name: 'Email Alerts Toggle',
            content: 'Email Notifications',
            subtitle: 'Receive weekly project & security digests',
            isExpanded: true,
          }),
          makeBlock('tpl-choice-chips', {
            name: 'Workspace Theme Chips',
            content: 'Preferred Theme',
            options: ['Obsidian Dark', 'Midnight Blue', 'Minimal Light'],
          }),
          saveBtn,
        ],
        logicFlows: [
          {
            id: `flow_${Date.now()}_prof`,
            name: 'Save Profile Settings',
            enabled: true,
            trigger: 'when-click',
            targetBlockId: saveBtn.id,
            steps: [
              {
                id: `step_${Date.now()}_p1`,
                action: 'save-storage',
                varName: 'userSettingsSaved',
                value: 'true',
              },
              {
                id: `step_${Date.now()}_p2`,
                action: 'show-toast',
                value: 'Profile settings saved!',
                toastType: 'success',
              },
            ],
          },
        ],
      };
    },
  },
  {
    id: 'tpl-page-contact',
    name: 'Contact & Support',
    siName: 'Contact Us (සම්බන්ධ වන්න)',
    slug: 'contact',
    category: 'landing',
    badge: 'Support',
    description: 'Support header, Name/Email/Message inputs, Submit ticket button, Location map & FAQ.',
    siDescription: 'Contact form, Submit message flow, Map එක සහ නිතර අසන ප්‍රශ්න (FAQ) සමඟ සම්බන්ධතා පිටුව.',
    accentColor: '#14b8a6',
    build: () => {
      const emailInp = makeBlock('tpl-email-input', {
        name: 'Contact Email',
        content: 'Your Email',
        subtitle: 'Your Email',
        actionPayload: 'name@company.com',
      });
      const msgBox = makeBlock('tpl-textarea', {
        name: 'Support Message',
        content: 'How can we help?',
        subtitle: 'Message',
        actionPayload: 'Write your question or feedback here...',
      });
      const sendBtn = makeBlock('tpl-submit-button', {
        name: 'Send Message Button',
        content: 'Send Support Message →',
        style: {
          customBgHex: '#0d9488',
          textColor: 'text-white',
          borderRadius: 'rounded-xl',
          padding: 'py-3 px-6',
          textAlign: 'center',
        },
      });
      return {
        blocks: [
          makeBlock('tpl-navbar', {
            name: 'Support Header',
            content: '💬 Help & Contact',
            subtitle: 'Home · Docs · Support · Status',
          }),
          makeBlock('tpl-heading', {
            name: 'Contact Title',
            content: 'Get in Touch with Our Team',
            subtitle: 'We typically respond within 2 business hours.',
            style: { fontSize: '2xl', fontWeight: 'bold', textAlign: 'center' },
          }),
          makeBlock('tpl-text-input', {
            name: 'Sender Name',
            content: 'Your Name',
            subtitle: 'Your Name',
            actionPayload: 'Full Name',
          }),
          emailInp,
          msgBox,
          sendBtn,
          makeBlock('tpl-static-map', {
            name: 'Office Location Map',
            content: 'Colombo Tech Hub · Sri Lanka',
            subtitle: 'Level 14, World Trade Center',
          }),
        ],
        logicFlows: [
          {
            id: `flow_${Date.now()}_cnt`,
            name: 'Submit Contact Ticket',
            enabled: true,
            trigger: 'when-click',
            targetBlockId: sendBtn.id,
            steps: [
              {
                id: `step_${Date.now()}_c1`,
                action: 'validate-form',
                targetBlockId: emailInp.id,
                validationRule: 'email',
              },
              {
                id: `step_${Date.now()}_c2`,
                action: 'submit-form',
                value: 'Thanks! Support ticket received.',
              },
              {
                id: `step_${Date.now()}_c3`,
                action: 'clear-form',
              },
            ],
          },
        ],
      };
    },
  },
  {
    id: 'tpl-page-pricing',
    name: 'Pricing & Plans',
    siName: 'Pricing Plans (මිල ගණන්)',
    slug: 'pricing',
    category: 'commerce',
    badge: 'Plans',
    description: 'Pricing comparison table, Star rating feedback, FAQ accordion & Upgrade CTA.',
    siDescription: 'Starter/Pro/Enterprise pricing packages, Customer rating සහ FAQ සමඟ මිල ගණන් පිටුව.',
    accentColor: '#a855f7',
    build: () => {
      const upgradeBtn = makeBlock('tpl-button', {
        name: 'Start Pro Trial Button',
        content: 'Start 14-Day Free Trial →',
        style: {
          customBgHex: '#9333ea',
          textColor: 'text-white',
          borderRadius: 'rounded-xl',
          padding: 'py-3 px-6',
          textAlign: 'center',
        },
      });
      return {
        blocks: [
          makeBlock('tpl-heading', {
            name: 'Pricing Headline',
            content: 'Simple, Transparent Pricing',
            subtitle: 'Choose the plan that scales with your team.',
            style: { fontSize: '2xl', fontWeight: 'bold', textAlign: 'center' },
          }),
          makeBlock('tpl-pricing', {
            name: 'Pro Tier Card',
            content: 'Pro Studio Plan',
            subtitle: '$29 / month · Unlimited pages, cloud sync & custom domains',
          }),
          makeBlock('tpl-rating-bar', {
            name: 'Customer Satisfaction Rating',
            content: 'Rated 4.9 / 5 by 1,200+ Builders',
            counterValue: 5,
          }),
          upgradeBtn,
          makeBlock('tpl-accordion', {
            name: 'Billing FAQ',
            content: 'Can I cancel or switch plans anytime?',
            subtitle: 'Yes — upgrade, downgrade, or cancel in one click with zero lock-in.',
          }),
        ],
        logicFlows: [
          {
            id: `flow_${Date.now()}_prc`,
            name: 'Start Trial Click',
            enabled: true,
            trigger: 'when-click',
            targetBlockId: upgradeBtn.id,
            steps: [
              {
                id: `step_${Date.now()}_pr1`,
                action: 'show-toast',
                value: '14-day Pro trial selected! Redirecting...',
                toastType: 'success',
              },
            ],
          },
        ],
      };
    },
  },
];
