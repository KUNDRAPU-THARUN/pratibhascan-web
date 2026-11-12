# PratibhaScan Web — Design System Specification

**Company**: KAARYAN LABS  
**Product**: PratibhaScan (AI-Powered Sports Talent Assessment & Development Platform)  
**Phase**: Phase 1 Foundation & Premium UI System  
**Version**: 1.0.0-phase1  

---

## 1. Design Philosophy & Direction

PratibhaScan is engineered as a high-trust, modern SaaS platform for athletes, sports academies, and state athletic institutions across India.

### Key Visual Principles:
- **Light-Themed Interface**: Clean white (`#FFFFFF`) and very light grey surfaces (`#F8FAFC`, `#F1F5F9`) ensuring high contrast and outdoor visibility.
- **Deep Navy Text**: High-legibility deep navy typography (`#0F172A`, `#1E293B`) instead of harsh pure black or washed-out grey.
- **Primary Teal Accent**: `#0D9488` (`teal-600`) representing scientific precision, vitality, and athletic energy.
- **Secondary Blue Accent**: `#2563EB` (`blue-600`) representing institutional reliability, data integrity, and national standards.
- **Subtle Borders & Soft Shadows**: `border-navy-200/80` with tailored soft card shadows (`0 2px 8px -2px rgba(15, 23, 42, 0.06)`).
- **Generous Spacing & Accessible Touch Targets**: Minimum 44px touch targets on interactive controls, adhering to WCAG 2.1 AA standards.

---

## 2. Color Palette & Tokens

The single source of truth for design tokens resides in [`src/styles/tokens.ts`](file:///c:/Users/kthar/OneDrive/Documents/Web-PratibhaScan/src/styles/tokens.ts) and is mirrored in [`tailwind.config.js`](file:///c:/Users/kthar/OneDrive/Documents/Web-PratibhaScan/tailwind.config.js).

### Primary Teal Scale
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `primary-50` | `#F0FDFA` | Light accent backgrounds, active badges |
| `primary-100` | `#CCFBF1` | Hover backgrounds, category badges |
| `primary-200` | `#99F6E4` | Border accents for active elements |
| `primary-500` | `#14B8A6` | Focus rings, vibrant highlights |
| `primary-600` | `#0D9488` | **Primary Brand Accent**, button fills, active icons |
| `primary-700` | `#0F766E` | Hover state for primary buttons, high-contrast headings |
| `primary-800` | `#115E59` | Active/pressed button state |
| `primary-900` | `#134E4A` | Dark contrast text |

### Secondary Blue Scale
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `secondary-50` | `#EFF6FF` | Academy role highlights, notification backgrounds |
| `secondary-100` | `#DBEAFE` | Subtle blue badge backgrounds |
| `secondary-200` | `#BFDBFE` | Soft blue border accents |
| `secondary-500` | `#3B82F6` | Secondary interactive accents |
| `secondary-600` | `#2563EB` | **Secondary Brand Accent**, institutional links |
| `secondary-700` | `#1D4ED8` | Secondary button hover |
| `secondary-900` | `#1E3A8A` | Deep contrast navy-blue |

### Neutrals & Deep Navy Scale
| Token | Hex | Usage |
| :--- | :--- | :--- |
| `navy-50` | `#F8FAFC` | App body background |
| `navy-100` | `#F1F5F9` | Secondary cards, subtle table headers |
| `navy-200` | `#E2E8F0` | Soft card and input borders |
| `navy-300` | `#CBD5E1` | Divider lines |
| `navy-400` | `#94A3B8` | Muted text, metadata labels, placeholder text |
| `navy-500` | `#64748B` | Secondary body text |
| `navy-600` | `#475569` | High-emphasis body copy |
| `navy-800` | `#1E293B` | Section titles, card titles |
| `navy-900` | `#0F172A` | **Deep Navy Primary Text**, main headlines |
| `navy-950` | `#020617` | Pitch navy hero backgrounds |

---

## 3. Typography

- **Font Family**: `'Plus Jakarta Sans'`, system-ui, -apple-system, sans-serif
- **Scale**:
  - Hero Display: `48px - 72px` (leading `1.12`, extrabold `800`)
  - Section Headings (H2): `30px - 36px` (leading tight, bold `700`)
  - Subsections / Card Titles (H3): `18px - 20px` (semibold `600`)
  - Body Text: `14px - 16px` (leading relaxed `1.6`, normal `400`)
  - Metadata / Badges / Captions: `11px - 12px` (semibold `600`)

---

## 4. Reusable UI Primitives

All primitives are located in [`src/components/ui/`](file:///c:/Users/kthar/OneDrive/Documents/Web-PratibhaScan/src/components/ui/) and exported via [`src/components/ui/index.ts`](file:///c:/Users/kthar/OneDrive/Documents/Web-PratibhaScan/src/components/ui/index.ts).

1. **`Button`** (`button.tsx`):
   - Variants: `primary`, `secondary`, `accent`, `outline`, `ghost`, `danger`, `link`.
   - Sizes: `sm` (h-8), `md` (h-10), `lg` (h-12).
   - Props: `isLoading` (renders animated `Loader2`), `disabled`, standard HTML attributes.
   - Accessible focus-visible rings with offset.

2. **`Input`** (`input.tsx`):
   - Associative accessible labels.
   - Built-in `aria-invalid` and `aria-describedby` wiring for error and helper text.
   - Soft border with focused teal ring.

3. **`Card`** (`card.tsx`):
   - Compound components: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
   - Light background with `border-navy-200/80` and subtle shadow.

4. **`Badge`** (`badge.tsx`):
   - Variants: `teal`, `blue`, `default`, `success`, `warning`, `danger`, `outline`.
   - Rounded pill styling with uppercase or title case typography.

5. **`Modal`** (`modal.tsx`):
   - WAI-ARIA compliant dialog (`role="dialog"`, `aria-modal="true"`).
   - Backdrop with click-to-dismiss.
   - Escape key listener and document body scroll lock.
   - Close button, title, description, and configurable actions.

6. **`FormField`** (`form-field.tsx`):
   - Accessible form wrapper combining label, required asterisk, child input/select, and error/helper text.

7. **Application State Feedback** (`states.tsx`):
   - `LoadingState`: Polite accessible spinner with context text.
   - `EmptyState`: Clean container with icon, title, description, and optional CTA button.
   - `ErrorState`: Rose alert container with title, explanation, and retry action.

---

## 5. Living Design System Showcase

The design system can be directly tested and inspected inside the running application at route:
`/dashboard/design-system`
