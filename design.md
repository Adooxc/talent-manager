# Talent Manager - Mobile App Design Document

## Overview
A personal mobile application for managing a database of models and artists, including their photos, contact information, social media accounts, and project management with cost calculations.

## Screen List

### 1. Home Screen (Talents List)
- Grid/list view of all talents with profile photos
- Search and filter functionality
- Quick add button (FAB)
- Sort by name, date added, category

### 2. Talent Detail Screen
- Large profile photo with gallery
- Full name and category (Model/Artist)
- Contact information (phone numbers)
- Social media links (Instagram, TikTok, Twitter, etc.)
- Price/rate information
- Notes section
- Edit and delete actions
- Photo update status indicator

### 3. Add/Edit Talent Screen
- Photo picker (multiple photos)
- Name input
- Category selector (Model/Artist/Both)
- Phone numbers (multiple)
- Social media accounts input
- Price/rate input
- Notes textarea

### 4. Projects Screen
- List of all projects
- Project status (Draft/Active/Completed)
- Quick view of selected talents count
- Total cost preview
- Add new project button

### 5. Project Detail Screen
- Project name and description
- Date range
- Selected talents list with individual costs
- Cost breakdown:
  - Subtotal (talents cost)
  - Profit margin percentage input
  - Final total with profit
- PDF export button
- Edit project button

### 6. Create/Edit Project Screen
- Project name input
- Description textarea
- Date picker (start/end)
- Talent selector (multi-select from database)
- Individual price override per talent
- Profit margin percentage

### 7. Settings Screen
- Monthly update reminder toggle
- Reminder frequency settings
- Default profit margin percentage
- App theme (light/dark)
- Data export/import

### 8. Update Reminder Screen
- List of talents needing photo updates
- Last updated date for each
- Quick action to mark as updated
- Batch update option

## Primary Content and Functionality

### Talent Data Structure
- Profile photo (main)
- Gallery photos (multiple)
- Full name
- Category (Model/Artist/Both)
- Phone numbers (array)
- Social media accounts:
  - Instagram
  - TikTok
  - Twitter/X
  - Facebook
  - YouTube
  - Other
- Price/rate (per project/day/hour)
- Notes
- Date added
- Last photo update date

### Project Data Structure
- Project name
- Description
- Start date
- End date
- Status (Draft/Active/Completed)
- Selected talents (with individual prices)
- Profit margin percentage
- Created date
- PDF export history

## Key User Flows

### Flow 1: Add New Talent
1. User taps "+" FAB on Home screen
2. Opens Add Talent screen
3. User selects photos from gallery
4. Fills in name, category, contact info
5. Adds social media links
6. Sets price/rate
7. Taps "Save"
8. Returns to Home with new talent visible

### Flow 2: Create Project with Cost Calculation
1. User navigates to Projects tab
2. Taps "New Project" button
3. Enters project details (name, dates)
4. Taps "Add Talents" → opens talent selector
5. Selects multiple talents from list
6. Confirms selection
7. Adjusts individual prices if needed
8. Sets profit margin percentage
9. Views calculated total
10. Saves project

### Flow 3: Export Project PDF
1. User opens Project Detail screen
2. Taps "Export PDF" button
3. App generates PDF with:
   - Project details
   - Selected talents with photos
   - Cost breakdown
   - Final total with profit
4. Share sheet opens for saving/sending

### Flow 4: Monthly Photo Update
1. App sends notification (monthly)
2. User opens Update Reminder screen
3. Views list of talents
4. For each talent:
   - Views current photos
   - Updates photos if needed
   - Marks as "Updated"
5. Completes update cycle

## Color Choices

### Primary Palette
- **Primary**: #6366F1 (Indigo) - Main accent color
- **Primary Dark**: #4F46E5 - Pressed states
- **Secondary**: #EC4899 (Pink) - Highlights and badges

### Background Colors
- **Light Mode**:
  - Background: #FFFFFF
  - Surface: #F8FAFC
  - Card: #FFFFFF
- **Dark Mode**:
  - Background: #0F172A
  - Surface: #1E293B
  - Card: #334155

### Text Colors
- **Light Mode**:
  - Primary: #0F172A
  - Secondary: #64748B
  - Muted: #94A3B8
- **Dark Mode**:
  - Primary: #F8FAFC
  - Secondary: #CBD5E1
  - Muted: #64748B

### Status Colors
- Success: #22C55E
- Warning: #F59E0B
- Error: #EF4444
- Info: #3B82F6

## Navigation Structure

### Tab Bar (Bottom)
1. **Talents** (house icon) - Home/Talents list
2. **Projects** (folder icon) - Projects management
3. **Updates** (bell icon) - Update reminders
4. **Settings** (gear icon) - App settings

## UI Components

### Talent Card
- Square profile photo (rounded corners)
- Name overlay at bottom
- Category badge (top right)
- Update indicator (if outdated)

### Project Card
- Project name (bold)
- Date range
- Talents count badge
- Total cost preview
- Status indicator

### Cost Calculator
- Line items for each talent
- Subtotal row
- Profit margin input (%)
- Calculated profit amount
- Grand total (highlighted)

## Data Persistence
- Local storage using AsyncStorage
- All data stored on device (personal use)
- No cloud sync required (privacy focused)
